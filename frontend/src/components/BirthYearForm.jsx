import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { EDIT_AUTHOR, ALL_AUTHORS } from '../queries'
import Select from 'react-select'

const BirthYearForm = ({ authors }) => {
  const [born, setBorn] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState(null)

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [ { query: ALL_AUTHORS } ]
  })

  const submit = async (event) => {
    event.preventDefault()

    if (!selectedAuthor) {
      return
    }

    const bornInt = parseInt(born)

    editAuthor({ 
      variables: { 
        name: selectedAuthor.value, 
        setBornTo: bornInt 
      } 
    })

    setSelectedAuthor(null)
    setBorn('')
  }

  const options = authors.map(a => ({
    value: a.name,
    label: a.name
  }))

  return (
    <div>
      <h3>Set birthyear</h3>
      <form onSubmit={submit}>
        <div>
          <Select
            value={selectedAuthor}
            onChange={setSelectedAuthor}
            options={options}
            isClearable={true}
            placeholder="Select author..."
          />
        </div>
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          born
          <input
            type="number"
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button 
          type="submit"
          disabled={!selectedAuthor || !born}
        >
          update author
        </button>
      </form>
    </div>
  )
}

export default BirthYearForm