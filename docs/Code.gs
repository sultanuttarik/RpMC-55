const SHEET_APPSTATE = "AppState";
const SHEET_STUDENTS = "Students";
const SHEET_LOGS = "Logs";
const SHEET_MASTER = "MasterList";
const SHEET_MIGRATED = "MigratedList";
const SHEET_MIGRATED_REQ = "MigratedRequests";

/* ===================== ENTRY ===================== */
function doPost(e) {
  try {
    const action = e.parameter.action;
    if (!action) return json({ status: "Error", message: "No action" });

    switch (action) {
      case "getAppState":
        return getAppState();
      case "register":
        return registerStudent(e.parameter);
      case "submitMigrated":
        return submitMigrated(e.parameter);
      case "checkMigratedStatus":
        return checkMigratedStatus(e.parameter);
      default:
        return json({ status: "Error", message: "Invalid action" });
    }
  } catch (err) {
    log("SYSTEM", "-", "ERROR", err.message);
    return json({ status: "Error", message: "Server error" });
  }
}

/* ===================== APP STATE ===================== */
function getAppState() {
  const sheet = ss().getSheetByName(SHEET_APPSTATE);
  const data = sheet.getLastRow() > 1
  ? sheet.getDataRange().getValues()
  : [];
  const state = {};
  for (let i = 1; i < data.length; i++) {
    state[data[i][0]] = data[i][1];
  }
  return json(state);
}

/* ===================== HELPERS ===================== */
function isMigratedStudent(rollNo) {
  const sheet = ss().getSheetByName(SHEET_MIGRATED);
  if (!sheet) return false;
  const data = sheet.getLastRow() > 1
  ? sheet.getDataRange().getValues()
  : [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(rollNo).trim()) return true;
  }
  return false;
}

/* ===================== NORMAL REGISTRATION ===================== */
function registerStudent(p) {
  const rollNo = String(p.rollNo || "").trim();
  const mPos = String(p.mPos || "").trim();
  const mScore = Number(p.mScore || 0);
  const email = String(p.email || "").trim();
  const bg = String(p.bg || "").trim();

  if (!rollNo || !mPos || !mScore || !bg) {
    log("REGISTER", rollNo, "FAIL", "Missing fields");
    return json({ status: "Fail", code: "MISSING_FIELDS", message: "Missing required fields" });
  }

  if (email && !email.toLowerCase().endsWith("@gmail.com")) {
    log("REGISTER", rollNo, "FAIL", "Invalid email");
    return json({ status: "Fail", code: "INVALID_EMAIL", message: "Only gmail.com email addresses are allowed" });
  }

  const master = ss().getSheetByName(SHEET_MASTER);
  const mData = master.getDataRange().getValues();

  let found = null;
  for (let i = 1; i < mData.length; i++) {
    if (String(mData[i][0]) === rollNo) {
      found = {
        name: mData[i][1],
        pos: String(mData[i][2]),
        score: Number(mData[i][3])
      };
      break;
    }
  }

  if (!found) {
    if (isMigratedStudent(rollNo)) {
      log("REGISTER", rollNo, "DENIED", "Migrated student attempted normal registration");
      return json({
        status: "Fail",
        code: "MIGRATED_STUDENT",
        message: "This roll number belongs to a migrated student."
      });
    }
    log("REGISTER", rollNo, "FAIL", "Invalid roll number");
    return json({
      status: "Fail",
      code: "INVALID_ROLL",
      message: "No matching record was found in the RpMC-55 batch database."
    });
  }

  if (found.pos !== mPos || found.score.toFixed(2) !== mScore.toFixed(2)) {
    log("REGISTER", rollNo, "FAIL", "Merit mismatch");
    return json({
      status: "Fail",
      code: "MERIT_MISMATCH",
      message: "The provided information does not match our records."
    });
  }

  const students = ss().getSheetByName(SHEET_STUDENTS);
  const data = students.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === rollNo) {
      log("REGISTER", rollNo, "FAIL", "Already registered");
      return json({
        status: "Fail",
        code: "ALREADY_REGISTERED",
        message: "Already registered"
      });
    }
  }

  const ballotID = generateBallotID();

  students.appendRow([
    rollNo,
    found.pos,
    mScore.toFixed(2),
    found.name,
    email,
    bg,
    ballotID,
    new Date()
  ]);

  log("REGISTER", rollNo, "SUCCESS", ballotID);

  return json({
    status: "Success",
    name: found.name,
    ballotID: ballotID
  });
}

/* ===================== MIGRATED SUBMISSION ===================== */
function submitMigrated(p) {
  const roll = String(p.rollNo || "").trim();
  const name = String(p.name || "").trim();
  const college = String(p.college || "").trim();
  const pos = String(p.mPos || "").trim();
  const score = String(p.mScore || "").trim();
  const email = String(p.email || "").trim();
  const bg = String(p.bg || "").trim();

  if (!roll || !name || !college || !pos || !score || !bg) {
    return json({
      status: "Fail",
      code: "MISSING_FIELDS",
      message: "Missing required fields"
    });
  }

  // 🔐 HARD VALIDATION: must exist in MigratedList
  if (!isMigratedStudent(roll)) {
    log("MIGRATED_SUBMIT", roll, "DENIED", "Roll not in MigratedList");
    return json({
      status: "Fail",
      code: "NOT_ELIGIBLE",
      message: "This roll number is not eligible for migrated registration."
    });
  }

  const sheet = ss().getSheetByName(SHEET_MIGRATED_REQ);
  const data = sheet.getLastRow() > 1
  ? sheet.getDataRange().getValues()
  : [];

  // prevent duplicate migrated request
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === roll) {
      return json({
        status: "Fail",
        code: "DUPLICATE_REQUEST",
        message: "A migrated registration request already exists for this roll number."
      });
    }
  }

  sheet.appendRow([
    new Date(),
    roll,
    name,
    college,
    pos,
    Number(score).toFixed(2),
    email,
    bg,
    "PENDING",
    ""
  ]);

  log("MIGRATED_SUBMIT", roll, "SUCCESS", "Request accepted");

  return json({
    status: "Success",
    message: "Migrated registration request submitted successfully."
  });
}

/* ===================== MIGRATED STATUS ===================== */
function checkMigratedStatus(p) {
  const roll = String(p.rollNo || "").trim();
  if (!roll) return json({ status: "Fail", message: "Roll number required" });

  const sheet = ss().getSheetByName(SHEET_MIGRATED_REQ);
  const data = sheet.getLastRow() > 1
  ? sheet.getDataRange().getValues()
  : [];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === roll) {
      return json({
        status: "Success",
        result: {
          roll: data[i][1],
          name: data[i][2],
          from: data[i][3],
          approval: data[i][8],
          notes: data[i][9]
        }
      });
    }
  }

  return json({
  status: "Fail",
  code: "NOT_FOUND",
  message: "No migrated request found"
});
}

/* ===================== UTILITIES ===================== */
function generateBallotID() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "RPMC55-";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function log(action, roll, status, msg) {
  ss().getSheetByName(SHEET_LOGS).appendRow([
    new Date(),
    action,
    roll,
    status,
    msg
  ]);
}

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
