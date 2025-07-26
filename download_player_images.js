import { processCSV } from './server.js';
import 'dotenv/config';

const csvPath = './players.csv'; // CSV file in root directory
processCSV(csvPath).then(() => console.log('?? All images processed!'));
