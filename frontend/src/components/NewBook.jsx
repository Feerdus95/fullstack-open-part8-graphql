import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_BOOK, ALL_BOOKS } from '../queries'

const NewBook = () => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])

  const [ createBook ] = useMutation(CREATE_BOOK, {
    update: (cache, { data: { addBook } }) => {
      // Update ALL_BOOKS query without genre filter
      try {
        const unfiltered = cache.readQuery({ 
          query: ALL_BOOKS,
          variables: { genre: null }
        })
        if (unfiltered) {
          cache.writeQuery({
            query: ALL_BOOKS,
            variables: { genre: null },
            data: {
              allBooks: unfiltered.allBooks.concat(addBook)
            }
          })
        }
      } catch (e) {
        console.log('First book added')
      }

      // Update genre-specific queries
      addBook.genres.forEach(genre => {
        try {
          const genreSpecific = cache.readQuery({
            query: ALL_BOOKS,
            variables: { genre }
          })
          if (genreSpecific) {
            cache.writeQuery({
              query: ALL_BOOKS,
              variables: { genre },
              data: {
                allBooks: genreSpecific.allBooks.concat(addBook)
              }
            })
          }
        } catch (e) {
          console.log('No cached data for genre:', genre)
        }
      })
    },
    onError: (error) => {
      console.error('Error creating book:', error)
    }
  })

  const submit = async (event) => {
    event.preventDefault()

    createBook({ 
      variables: { 
        title, 
        author, 
        published: parseInt(published), 
        genres 
      } 
    })

    setTitle('')
    setAuthor('')
    setPublished('')
    setGenres([])
    setGenre('')
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

export default NewBook