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
app.get("/concatBoletinData", (req, res) => {
  //  Read csv to use it
  const csvData1 = fs.readFileSync("inputs/file1.csv", "utf8");
  const csvData3 = fs.readFileSync("inputs/file3.csv", "utf8");

  //  Convert data to json
  const data1 = papa.parse(csvData1, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  }).data;
  const data3 = papa.parse(csvData3, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  }).data;

  //  Vars
  let res2 = 0;
  let res3 = 0;
  let finde_it = 0;
  let notFound = [];
  let moreThanOnce = [];
  let matchRow = 0;
  let checkColumns = process.env.LIST_COLS1.split(",");

  for (let i = 0; i < data3.length; i++) {
    for (let j = 0; j < data1.length; j++) {
      //  If names and grade matches do somethings
      if (
        diacritics.remove(data3[i].APELLIDO_PATERNO).trim().toUpperCase() ==
          diacritics.remove(data1[j].APELLIDO_PATERNO).trim().toUpperCase() &&
        diacritics.remove(data3[i].APELLIDO_MATERNO).trim().toUpperCase() ==
          diacritics.remove(data1[j].APELLIDO_MATERNO).trim().toUpperCase() &&
        diacritics.remove(data3[i].NOMBRES).trim().toUpperCase() ==
          diacritics.remove(data1[j].NOMBRES).trim().toUpperCase() &&
        diacritics.remove(data3[i].PROGRAMA).trim().toUpperCase() ==
          diacritics.remove(data1[j].PROGRAMA).trim().toUpperCase()
      ) {
        //  Save values of the n° of row where its equals
        matchRow = j;
        res2++; //  Count of equals rows
        finde_it++; //  How many times data3's row is in data1
      }
    }
    //  If it doesn't match with any row of data2
    if (finde_it == 0) {
      notFound.push({
        ape_paterno: data3[i].APELLIDO_PATERNO,
        ape_materno: data3[i].APELLIDO_MATERNO,
        nombres: data3[i].NOMBRES,
      });
    }
    //  If it was more than once in data1
    else if (finde_it > 1) {
      moreThanOnce.push({
        ape_paterno: data3[i].APELLIDO_PATERNO,
        ape_materno: data3[i].APELLIDO_MATERNO,
        nombres: data3[i].NOMBRES,
        how_many_times: finde_it,
      });
    }
    //  If it's just one coincidence
    else if (finde_it == 1) {
      //  Save data from one data to other
      checkColumns.forEach((item) => {
        if (data1[matchRow][item].trim() == "") {
          data1[matchRow][item] = data3[i][item];
        }
      });
      res3++;
    }
    finde_it = 0;
  }

  //  Create csv with data2 in result path
  const newCsv = papa.unparse(data1, { delimiter: ";" });
  fs.writeFileSync("result/output2.csv", newCsv, "utf-8");

  //  Response in JSON
  res.json({
    message: "Success",
    cuenta_inicial: data3.length,
    coincidencia_nombres_y_grado: res2,
    actualizaciones_realizadas: res3,
    notFound,
    moreThanOnce,
  });
});

app.get("/concatSumData", (req, res) => {
  //  Read csv to use it
  const csvData1 = fs.readFileSync("inputs/file1.csv", "utf8");
  const csvData2 = fs.readFileSync("inputs/file2.csv", "utf8");

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
  let state = 0;
  let count = 0;
  let max = 0;
  let notFound = [];
  let checkColumns = process.env.LIST_COLS2.split(",");

  //  Loops
  for (let i = 0; i < data2.length; i++) {
    console.log(i);
    for (let j = 0; j < data1.length; j++) {
      if (data2[i].CODIGO_ALUMNO == data1[j].CODIGO_ALUMNO) {
        state = 1;
        checkColumns.forEach((item) => {
          data1[j][item] = data2[i][item];
        });
        count++;
        break;
      }
    }
    if (state == 0) {
      notFound.push({
        codigo: data2[i].CODIGO_ALUMNO,
      });
    }
    state = 0;
  }

  //  Create csv with data2 in result path
  const newCsv = papa.unparse(data1);
  fs.writeFileSync("result/output1.csv", newCsv, "utf-8");

  //  Response
  res.json({
    count,
    notFound,
  });
});

app.get("/includeMD", (req, res) => {
  //  Read csv to use it
  const csvData1 = fs.readFileSync("inputs/file1.csv", "utf8");

  //  Convert data to json
  const data1 = papa.parse(csvData1, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  }).data;

  for (let i = 0; i < data1.length; i++) {
    data1[i]["M/D"] = data1[i].PROGRAMA[0];
  }

  //  Create csv with data1 in result path
  const newCsv = papa.unparse(data1);
  fs.writeFileSync("result/output3.csv", newCsv, "utf-8");

  res.json({ message: "Done!" });
});

app.get("/separateYearAndSemester", (req, res) => {
  //  Read csv to use it
  const csvData1 = fs.readFileSync("inputs/consolidado.csv", "utf8");

  //  Convert data to json
  const data1 = papa.parse(csvData1, {
    header: true,
    delimiter: ",",
    skipEmptyLines: true,
  }).data;

  for (let i = 0; i < data1.length; i++) {
    //  Separate
    data1[i]["AÑO_PRIMERA_MATRICULA"] = data1[i]["PRIMERA_MATRICULA"].substring(
      0,
      4
    );
    data1[i]["AÑO_SEMESTRE_EGRESO"] = data1[i]["SEMESTRE_EGRESO"].substring(
      0,
      4
    );
    data1[i]["AÑO_ULTIMO_PERIODO_MATRICULADO"] = data1[i][
      "ULTIMO_PERIODO_MATRICULADO"
    ].substring(0, 4);
  }

  //  Create csv with data1 in result path
  const newCsv = papa.unparse(data1);
  fs.writeFileSync("result/final.csv", newCsv, "utf-8");

  res.json({ message: "Done!" });
});

//  Launch app
app.listen(3000, () => console.log("Listening on port 3000"));
