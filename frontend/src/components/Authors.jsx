const Authors = ({ authors }) => {
    const tableStyle = {
      borderCollapse: 'collapse',
      marginTop: '10px'
    }
  
    const cellStyle = {
      paddingRight: '30px',
      textAlign: 'left'
    }
  
    return (
      <div>
        <h2>authors</h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <th style={cellStyle}>name</th>
              <th style={cellStyle}>born</th>
              <th style={cellStyle}>books</th>
            </tr>
            {authors.map((a) => (
              <tr key={a.name}>
                <td style={cellStyle}>{a.name}</td>
                <td style={cellStyle}>{a.born}</td>
                <td style={cellStyle}>{a.bookCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  export default Authors