import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS, ME } from '../queries'

const Books = () => {
  const [selectedGenre, setSelectedGenre] = useState(null)
  const result = useQuery(ALL_BOOKS, {
    variables: { genre: selectedGenre }
  })
  const userResult = useQuery(ME)

  useEffect(() => {
    if (userResult.data?.me) {
      setSelectedGenre(userResult.data.me.favoriteGenre)
    }
  }, [userResult.data])

  if (result.loading) {
    return <div>loading...</div>
  }

  const books = result.data.allBooks
  const genres = [...new Set(books.flatMap(b => b.genres))]

  const buttonStyle = {
    margin: '0 5px 5px 0',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    backgroundColor: 'white',
    color: 'black'
  }
  
  const selectedButtonStyle = {
    margin: '0 5px 5px 0',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    border: '1px solid #0066cc',
    backgroundColor: '#0066cc',
    color: 'white'
  }

  return (
    <div>
      <h2>books</h2>

      {selectedGenre && (
        <p>
          in genre <b>{selectedGenre}</b>
        </p>
      )}

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((book) => (
            <tr key={book.title}>
              <td>{book.title}</td>
              <td>{book.author.name}</td>
              <td>{book.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        {genres.map(genre => (
          <button 
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            style={genre === selectedGenre ? selectedButtonStyle : buttonStyle}
          >
            {genre}
          </button>
        ))}
        <button 
          onClick={() => setSelectedGenre(null)}
          style={!selectedGenre ? selectedButtonStyle : buttonStyle}
        >
          all genres
        </button>
      </div>
    </div>
  )
}

export default Books