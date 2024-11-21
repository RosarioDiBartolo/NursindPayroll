import { Table, TableHead, TableBody, TableRow, TableCell } from '../ui/table';

const DataFrame = ({ data }: { data: object }) => {
  // Extract columns and values from the data object
  const columns = Object.keys(data);
  const values = Object.values(data);

  // Format data for rendering in the table
  const formattedData = [];
  for (let row = 0; row < values[0].length; row++) {
    const rowData = values.map(columnData => columnData[row]);
    formattedData.push(rowData);
  }

  return (
    <div>
      <h2>DataFrame</h2>
      <Table>
        <TableHead>
          <TableRow  >
            {columns.map((columnName, index) => (
              <TableCell key={index}>{columnName}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {formattedData.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cellData, cellIndex) => (
                <TableCell key={cellIndex} style={{ textAlign: 'center' }}>{cellData}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataFrame;