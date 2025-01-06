import { useQuery, useSubscription, useApolloClient } from '@apollo/client'
import { ALL_AUTHORS, BOOK_ADDED } from '../queries'

const Authors = () => {
  const client = useApolloClient()
  const result = useQuery(ALL_AUTHORS)

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded
      console.log('New book added:', addedBook)

      const dataInStore = client.readQuery({ query: ALL_AUTHORS })
      const updatedAuthors = dataInStore.allAuthors.map(author => {
        if (author.name === addedBook.author.name) {
          return {
            ...author,
            bookCount: author.bookCount + 1
          }
        }
        return author
      })

      client.writeQuery({
        query: ALL_AUTHORS,
        data: {
          allAuthors: updatedAuthors
        }
      })
    }
  })

  if (result.loading) {
    return <div>loading...</div>
  }

  const authors = result.data.allAuthors

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Authors