/**
 * Google Apps Script Web App — Abdullah Elawady Studio Booking Bridge
 *
 * Setup (2 minutes, 100% free):
 * 1. Open https://script.google.com signed in as your studio Google account
 * 2. Create a "New project" and paste this entire file into Code.gs
 * 3. Left sidebar -> Services (+) -> select "Google Calendar API" -> Add
 * 4. Project Settings -> Script Properties -> Add `BOOKING_SECRET` (required, 32-byte random secret)
 * 5. Click Deploy -> New deployment -> Type: Web app
 *    - Execute as: Me (your studio Google account)
 *    - Who has access: Anyone
 * 6. Authorize permissions and store the /exec Web App URL + secret in Vercel Env Vars
 */

var BOOKING_TIMEZONE = "Africa/Cairo";
var HOST_NAME = "Abdullah Elawady";
var ALLOWED_DURATIONS = { 30: true, 45: true, 60: true };
var MAX_PAYLOAD_CHARS = 4096;
var MAX_ADVANCE_MS = 47 * 86400000;
var MIN_LEAD_MS = 10 * 60000;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getConfiguredSecret_() {
  return (
    PropertiesService.getScriptProperties().getProperty("BOOKING_SECRET") || ""
  ).trim();
}

function timingSafeEqual_(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  var lenA = a.length;
  var lenB = b.length;
  var maxLen = Math.max(lenA, lenB);
  var diff = lenA ^ lenB;
  for (var i = 0; i < maxLen; i++) {
    var codeA = i < lenA ? a.charCodeAt(i) : 0;
    var codeB = i < lenB ? b.charCodeAt(i) : 0;
    diff |= codeA ^ codeB;
  }
  return diff === 0;
}

function verifySecret_(provided) {
  var expected = getConfiguredSecret_();
  if (!expected || typeof provided !== "string" || !provided) {
    return false;
  }
  return timingSafeEqual_(provided, expected);
}

function sanitizeSingleLine_(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeNotes_(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, "")
    .trim();
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet() {
  return jsonOutput_({
    ok: false,
    code: "METHOD_NOT_ALLOWED",
    error: "Method not allowed.",
  });
}

function handleAvailability_(body) {
  try {
    var nowMs = Date.now();
    var minAllowed = nowMs - 3600000;
    var maxAllowed = nowMs + MAX_ADVANCE_MS;

    var startMs = body.timeMin ? new Date(String(body.timeMin)).getTime() : minAllowed;
    var endMs = body.timeMax ? new Date(String(body.timeMax)).getTime() : maxAllowed;

    if (isNaN(startMs) || isNaN(endMs)) {
      return jsonOutput_({
        ok: false,
        code: "INVALID_RANGE",
        error: "Invalid availability range.",
      });
    }

    startMs = Math.max(minAllowed, startMs);
    endMs = Math.min(maxAllowed, endMs);
    if (endMs <= startMs) {
      return jsonOutput_({ ok: true, busy: [] });
    }

    var freebusy = Calendar.Freebusy.query({
      timeMin: new Date(startMs).toISOString(),
      timeMax: new Date(endMs).toISOString(),
      timeZone: BOOKING_TIMEZONE,
      items: [{ id: "primary" }],
    });

    var busy =
      (freebusy &&
        freebusy.calendars &&
        freebusy.calendars.primary &&
        freebusy.calendars.primary.busy) ||
      [];

    return jsonOutput_({
      ok: true,
      busy: busy.map(function (b) {
        return { start: b.start, end: b.end };
      }),
    });
  } catch (err) {
    console.error("Availability error:", err);
    return jsonOutput_({
      ok: false,
      code: "FREEBUSY_ERROR",
      error: "Calendar request failed.",
    });
  }
}

function handleBook_(body) {
  var name = sanitizeSingleLine_(body.name);
  var email = sanitizeSingleLine_(body.email);
  var notes = sanitizeNotes_(body.notes);
  var startIso = typeof body.startIso === "string" ? body.startIso.trim() : "";
  var endIso = typeof body.endIso === "string" ? body.endIso.trim() : "";
  var durationMinutes = Number(body.durationMinutes);
  var visitorTimeZone =
    sanitizeSingleLine_(body.visitorTimeZone) || BOOKING_TIMEZONE;

  if (
    name.length < 2 ||
    name.length > 80 ||
    !EMAIL_RE.test(email) ||
    email.length > 120 ||
    notes.length > 600 ||
    !startIso ||
    !endIso ||
    !ALLOWED_DURATIONS[durationMinutes]
  ) {
    return jsonOutput_({
      ok: false,
      code: "INVALID_PAYLOAD",
      error: "Missing or invalid booking fields.",
    });
  }

  var nowMs = Date.now();
  var startMs = new Date(startIso).getTime();
  var endMs = new Date(endIso).getTime();
  if (
    isNaN(startMs) ||
    isNaN(endMs) ||
    endMs - startMs !== durationMinutes * 60000 ||
    startMs < nowMs + MIN_LEAD_MS ||
    startMs > nowMs + MAX_ADVANCE_MS
  ) {
    return jsonOutput_({
      ok: false,
      code: "INVALID_TIME",
      error: "Invalid meeting start or end timestamp.",
    });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (_lockErr) {
    return jsonOutput_({
      ok: false,
      code: "LOCK_TIMEOUT",
      error: "Server is busy processing another booking. Please try again.",
    });
  }

  try {
    // Re-check Google Calendar inside the mutex lock to guarantee zero double-bookings
    var freebusy = Calendar.Freebusy.query({
      timeMin: new Date(startMs).toISOString(),
      timeMax: new Date(endMs).toISOString(),
      timeZone: BOOKING_TIMEZONE,
      items: [{ id: "primary" }],
    });

    var busyList =
      (freebusy &&
        freebusy.calendars &&
        freebusy.calendars.primary &&
        freebusy.calendars.primary.busy) ||
      [];

    var hasConflict = busyList.some(function (b) {
      var bStart = new Date(b.start).getTime();
      var bEnd = new Date(b.end).getTime();
      return startMs < bEnd && endMs > bStart;
    });

    if (hasConflict) {
      return jsonOutput_({
        ok: false,
        code: "SLOT_TAKEN",
        error: "This slot was just reserved. Please pick another available time.",
      });
    }

    var descriptionLines = [
      "Booked via abdullahelawady.studio",
      "",
      "Client: " + name + " (" + email + ")",
      "Duration: " + durationMinutes + " min",
      "Visitor Timezone: " + visitorTimeZone,
    ];
    if (notes) {
      descriptionLines.push("", "Project Brief / Notes:", notes);
    }

    var eventResource = {
      summary: "Discovery Call — " + name + " × " + HOST_NAME,
      description: descriptionLines.join("\n"),
      start: {
        dateTime: new Date(startMs).toISOString(),
        timeZone: BOOKING_TIMEZONE,
      },
      end: {
        dateTime: new Date(endMs).toISOString(),
        timeZone: BOOKING_TIMEZONE,
      },
      attendees: [{ email: email, displayName: name }],
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      conferenceData: {
        createRequest: {
          requestId: Utilities.getUuid(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    var created = Calendar.Events.insert(eventResource, "primary", {
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });

    var meetLink = created.hangoutLink || "";
    if (
      !meetLink &&
      created.conferenceData &&
      created.conferenceData.entryPoints
    ) {
      for (var i = 0; i < created.conferenceData.entryPoints.length; i++) {
        var ep = created.conferenceData.entryPoints[i];
        if (ep.entryPointType === "video" && ep.uri) {
          meetLink = ep.uri;
          break;
        }
      }
    }

    return jsonOutput_({
      ok: true,
      eventId: created.id || "",
      meetLink: meetLink,
      htmlLink: created.htmlLink || "",
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    });
  } catch (err) {
    console.error("Booking error:", err);
    return jsonOutput_({
      ok: false,
      code: "BOOKING_ERROR",
      error: "Calendar request failed.",
    });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || "";
    if (!raw || raw.length > MAX_PAYLOAD_CHARS) {
      return jsonOutput_({
        ok: false,
        code: "PAYLOAD_TOO_LARGE",
        error: "Invalid request payload size.",
      });
    }

    var body = JSON.parse(raw);
    if (!body || typeof body !== "object" || !verifySecret_(body.secret)) {
      return jsonOutput_({
        ok: false,
        code: "UNAUTHORIZED",
        error: "Unauthorized.",
      });
    }

    if (body.action === "availability") {
      return handleAvailability_(body);
    }
    if (body.action === "book") {
      return handleBook_(body);
    }

    return jsonOutput_({
      ok: false,
      code: "INVALID_ACTION",
      error: "Invalid request.",
    });
  } catch (err) {
    console.error("Dispatch error:", err);
    return jsonOutput_({
      ok: false,
      code: "BOOKING_ERROR",
      error: "Calendar request failed.",
    });
  }
}
