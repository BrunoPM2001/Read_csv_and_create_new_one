import express from "express";
import cors from "cors";
import papa from "papaparse";
import diacritics from "diacritics";
import fs from "fs";
import "dotenv/config";

const app = express();

//  Middlewares
app.use(express.json());
app.use(cors());

//  Main process
app.get("/importCsv", (req, res) => {
  //  Read csv to use it
  const csvData1 = fs.readFileSync("inputs/file1.csv", "utf8");
  const csvData2 = fs.readFileSync("inputs/file23.csv", "utf8");

  //  Convert data to json
  const data1 = papa.parse(csvData1, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  }).data;
  const data2 = papa.parse(csvData2, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  }).data;

  //  Vars
  let res1 = 0;
  let res2 = 0;
  let res3 = 0;
  let finde_it = 0;
  let notFound = [];
  let moreThanOnce = [];
  let matchRow = 0;
  let checkColumns = process.env.LIST_COLS.split(",");

  //  Search in all rows of data 2
  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < data1.length; j++) {
      //  If names and grade matches do somethings
      if (
        diacritics.remove(data2[i].ape_paterno).trim() ==
          diacritics.remove(data1[j].ape_paterno).trim() &&
        diacritics.remove(data2[i].ape_materno).trim() ==
          diacritics.remove(data1[j].ape_materno).trim() &&
        diacritics.remove(data2[i].nom_alumno).trim() ==
          diacritics.remove(data1[j].nom_alumno).trim() &&
        data2[i]["M/D"].trim() == data1[j]["M/D"].trim()
      ) {
        //  Save values of the n° of row where its equals
        matchRow = j;
        res2++; //  Count of equals rows
        finde_it++; //  How many times data2's row is in data1
      }
    }
    //  If it doesn't match with any row of data1
    if (finde_it == 0) {
      notFound.push({
        ape_paterno: data2[i]["ape_paterno"],
        ape_materno: data2[i]["ape_materno"],
        nombres: data2[i]["nom_alumno"],
      });
    }
    //  If it was more than once in data1
    else if (finde_it > 1) {
      moreThanOnce.push({
        ape_paterno: data2[i]["ape_paterno"],
        ape_materno: data2[i]["ape_materno"],
        nombres: data2[i]["nom_alumno"],
        how_many_times: finde_it,
      });
    }
    //  If it's just one coincidence
    else if (finde_it == 1) {
      //  Save all empty cells in data1
      checkColumns.forEach((item) => {
        if (data1[matchRow][item].trim() == "") {
          data1[matchRow][item] = data2[i][item];
        }
      });
      res3++;
    }
    finde_it = 0;
  }

  //  Create csv with data1 in result path
  const newCsv = papa.unparse(data1);
  fs.writeFileSync("result/output.csv", newCsv, "utf-8");

  //  Response in JSON
  res.json({
    message: "Success",
    cuenta_inicial: data2.length,
    coincidencia_nombres: res1,
    coincidencia_nombres_y_grado: res2,
    actualizaciones_realizadas: res3,
    notFound,
    moreThanOnce,
  });
});

//  Launch app
app.listen(3000, () => console.log("Listening on port 3000"));
