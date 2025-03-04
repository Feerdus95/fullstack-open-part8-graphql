import { createRoot } from 'react-dom/client'
import App from './App'
import { 
  ApolloClient, 
  InMemoryCache, 
  ApolloProvider, 
  createHttpLink,
  split
} from '@apollo/client'
import { setContext } from '@apollo/link-context'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'

const httpLink = createHttpLink({
  uri: 'http://localhost:4000',
})

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('library-user-token')
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : null,
    }
  }
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000'
  })
)

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  authLink.concat(httpLink)
)

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: splitLink
})

const root = createRoot(document.getElementById('root'))
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
)