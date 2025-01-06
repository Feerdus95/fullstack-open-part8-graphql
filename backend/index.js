const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const express = require('express')
const cors = require('cors')
const http = require('http')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')
const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const { EventEmitter } = require('events')
require('dotenv').config()

const eventEmitter = new EventEmitter()
const pubsub = {
  publish(eventName, payload) {
    eventEmitter.emit(eventName, payload)
  },
  asyncIterator(eventName) {
    return {
      [Symbol.asyncIterator]() {
        const queue = []
        const listeners = {
          next: null,
        }

        eventEmitter.on(eventName, (payload) => {
          if (listeners.next) {
            listeners.next({ value: payload, done: false })
            listeners.next = null
          } else {
            queue.push(payload)
          }
        })

        return {
          next() {
            if (queue.length) {
              return Promise.resolve({ value: queue.shift(), done: false })
            }
            return new Promise((resolve) => {
              listeners.next = resolve
            })
          },
          return() {
            eventEmitter.removeAllListeners(eventName)
            return Promise.resolve({ done: true })
          },
          throw(error) {
            eventEmitter.removeAllListeners(eventName)
            return Promise.reject(error)
          },
        }
      },
    }
  },
}

const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  console.log('connected to MongoDB')
    Book.countDocuments().then(count => console.log('Books:', count))
    Author.countDocuments().then(count => console.log('Authors:', count))
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      let query = {}

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        if (!author) {
          return []
        }
        query.author = author._id
      }
      
      if (args.genre) {
        query.genres = { $in: [args.genre] }
      }

      return Book.find(query).populate('author')
    },
    allAuthors: async () => Author.find({}),
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Author: {
    bookCount: async (root) => {
      const books = await Book.find({ author: root._id })
      return books.length
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          }
        })
      }

      let author = await Author.findOne({ name: args.author })

      if (!author) {
        author = new Author({ name: args.author })
        try {
          await author.save()
        } catch (error) {
          throw new GraphQLError('Saving author failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.author,
              error: error.message
            }
          })
        }
      }

      const book = new Book({ ...args, author: author._id })

      try {
        await book.save()
        const savedBook = await Book.findById(book._id).populate('author')
        pubsub.publish('BOOK_ADDED', { bookAdded: savedBook })
        return savedBook
      } catch (error) {
        throw new GraphQLError('Saving book failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error: error.message
          }
        })
      }
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name })
      if (!author) {
        throw new GraphQLError('Author not found', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name
          }
        })
      }

      author.born = args.setBornTo
      try {
        await author.save()
      } catch (error) {
        throw new GraphQLError('Saving author failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error: error.message
          }
        })
      }

      return author
    },
    createUser: async (root, args) => {
      const user = new User({ ...args })

      try {
        await user.save()
      } catch (error) {
        throw new GraphQLError('Creating the user failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args,
            error: error.message
          }
        })
      }

      return user
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
    
      if (!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
    
      const userForToken = {
        username: user.username,
        id: user._id,
      }
    
      return { value: jwt.sign(userForToken, JWT_SECRET) }
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
    },
  },
}

const start = async () => {
  const app = express()
  const httpServer = http.createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/',
  })

  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const serverCleanup = useServer({ schema }, wsServer)

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  })

  await server.start()

  app.use(
    '/',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.startsWith('Bearer ')) {
          const decodedToken = jwt.verify(
            auth.substring(7), JWT_SECRET
          )
          const currentUser = await User.findById(decodedToken.id)
          return { currentUser }
        }
      },
    }),
  )

  const PORT = 4000

  httpServer.listen(PORT, () => 
    console.log(`Server is now running on http://localhost:${PORT}`)
  )
}

start()