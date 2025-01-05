import { useQuery } from '@apollo/client'
import { ALL_BOOKS, ME } from '../queries'

const Recommend = () => {
  const userResult = useQuery(ME, {
    fetchPolicy: 'network-only'
  })
  
  const genre = userResult.data?.me?.favoriteGenre
  const result = useQuery(ALL_BOOKS, {
    variables: { genre },
    skip: !genre,
    fetchPolicy: 'cache-and-network'
  })

  if (userResult.loading) {
    return <div>loading user data...</div>
  }

  if (!userResult.data?.me) {
    return (
      <div>
        <h2>recommendations</h2>
        <p>please log in to see recommendations</p>
      </div>
    )
  }

  if (result.loading) {
    return <div>loading recommendations...</div>
  }

  const books = result.data?.allBooks || []

  return (
    <div>
      <h2>recommendations</h2>
      <p>books in your favorite genre <b>{genre}</b></p>

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
      {books.length === 0 && (
        <p>No books found in your favorite genre.</p>
      )}
    </div>
  )
}

export default Recommend