import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";
import xlsx from "xlsx";

const app = express();

//  Middlewares
app.use(express.json());
app.use(cors());

//  Main process
app.get("/download", (req, res) => {
  //  Read excel and convert data to json
  const workSheet = xlsx.readFile(process.env.FIRST_EXCEL).Sheets[
    process.env.FIRST_SHEET
  ];
  const excelData = xlsx.utils.sheet_to_json(workSheet);

  res.json({ message: "Success", data: excelData });
});

app.listen(3000);
