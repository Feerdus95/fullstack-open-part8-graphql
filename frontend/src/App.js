import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ALL_AUTHORS, ALL_BOOKS, CREATE_BOOK } from './queries'
import BirthYearForm from './components/BirthYearForm'

const Authors = ({ authors }) => {
  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th align="left">name</th>
            <th align="left">born</th>
            <th align="left">books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td style={{ paddingRight: '10px' }}>{a.name}</td>
              <td style={{ paddingRight: '10px' }}>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <BirthYearForm authors={authors} />
    </div>
  )
}

const Books = ({ books }) => {
  return (
    <div>
      <h2>books</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => (
            <tr key={b.title}>
              <td>{b.title}</td>
              <td>{b.author}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const NewBook = () => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])

  const [createBook] = useMutation(CREATE_BOOK, {
    refetchQueries: [
      { query: ALL_BOOKS },
      { query: ALL_AUTHORS }
    ],
    onError: (error) => {
      console.log(error)
    }
  })

  const submit = async (event) => {
    event.preventDefault()

    try {
      const publishedInt = parseInt(published)
      await createBook({ 
        variables: { 
          title, 
          author, 
          published: publishedInt, 
          genres 
        } 
      })

      setTitle('')
      setAuthor('')
      setPublished('')
      setGenres([])
      setGenre('')
    } catch (error) {
      console.error('Error creating book:', error)
    }
  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  return (
    <div>
      <h2>add book</h2>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  )
}

const App = () => {
  const [page, setPage] = useState('authors')
  const authors = useQuery(ALL_AUTHORS)
  const books = useQuery(ALL_BOOKS)

  if (authors.loading || books.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
      </div>

      {page === 'authors' && (
        <Authors authors={authors.data.allAuthors} />
      )}

      {page === 'books' && (
        <Books books={books.data.allBooks} />
      )}

      {page === 'add' && (
        <NewBook />
      )}
    </div>
  )
}

export default App