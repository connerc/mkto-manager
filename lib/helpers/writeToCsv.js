const fs = require('fs-extra')
const json2csv = require('json2csv').parse;
const ObjectsToCsv = require('objects-to-csv')


const writeToCsv = async (fileName, data) => {
    const csv = new ObjectsToCsv(data)

    return await csv.toDisk(fileName, {append: true})
}

/*
const writeToCsv = (fileName, data) => {
    // output file in the same folder
    //const filename = path.join(__dirname, 'CSV', `${fileName}`);
    let rows;

    // If file doesn't exist, we will create new file and add rows with headers.    
    if (!fs.existsSync(fileName)) {
        rows = json2csv(data, { header: true });
        //fs.ensureFileSync(fileName)
    } else {
        // Rows without headers.
        rows = json2csv(data, { header: false });
    }

    // Append file function can create new file too.
    fs.appendFileSync(fileName, rows);
    // Always add new line if file already exists.
    //fs.appendFileSync(fileName, "\r\n");

    //fs.close(fileName, {});
}
//*/

module.exports = writeToCsv