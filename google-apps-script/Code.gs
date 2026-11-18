/**
 * Google Apps Script Web App — Abdullah Elawady Studio Booking Bridge
 *
 * Setup (2 minutes, 100% free):
 * 1. Open https://script.google.com signed in as abdalla.awadi@gmail.com
 * 2. Create a "New project" and paste this entire file into Code.gs
 * 3. Left sidebar -> Services (+) -> select "Google Calendar API" -> Add
 * 4. Click Deploy -> New deployment -> Type: Web app
 *    - Execute as: Me (abdalla.awadi@gmail.com)
 *    - Who has access: Anyone
 * 5. Authorize permissions and copy the resulting /exec Web App URL
 */

var BOOKING_TIMEZONE = "Africa/Cairo";
var HOST_NAME = "Abdullah Elawady";
var ALLOWED_DURATIONS = { 30: true, 45: true, 60: true };

// Optional: set a shared secret via Script Properties (BOOKING_SECRET) if desired.
function getConfiguredSecret_() {
  return PropertiesService.getScriptProperties().getProperty("BOOKING_SECRET") || "";
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var expectedSecret = getConfiguredSecret_();
    if (expectedSecret && params.secret !== expectedSecret) {
      return jsonOutput_({ ok: false, code: "UNAUTHORIZED", error: "Unauthorized" });
    }

    var now = new Date();
    var timeMin = params.timeMin || new Date(now.getTime() - 3600000).toISOString();
    var timeMax =
      params.timeMax || new Date(now.getTime() + 47 * 86400000).toISOString();

    var freebusy = Calendar.Freebusy.query({
      timeMin: timeMin,
      timeMax: timeMax,
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
    return jsonOutput_({
      ok: false,
      code: "FREEBUSY_ERROR",
      error: String((err && err.message) || err),
    });
  }
}

function doPost(e) {
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
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var body = JSON.parse(raw);

    var expectedSecret = getConfiguredSecret_();
    if (expectedSecret && body.secret !== expectedSecret) {
      return jsonOutput_({ ok: false, code: "UNAUTHORIZED", error: "Unauthorized" });
    }

    var name = String(body.name || "").trim();
    var email = String(body.email || "").trim();
    var notes = String(body.notes || "").trim();
    var startIso = String(body.startIso || "").trim();
    var endIso = String(body.endIso || "").trim();
    var durationMinutes = Number(body.durationMinutes);
    var visitorTimeZone = String(body.visitorTimeZone || BOOKING_TIMEZONE).trim();

    if (!name || !email || !startIso || !endIso || !ALLOWED_DURATIONS[durationMinutes]) {
      return jsonOutput_({
        ok: false,
        code: "INVALID_PAYLOAD",
        error: "Missing or invalid booking fields.",
      });
    }

    var startMs = new Date(startIso).getTime();
    var endMs = new Date(endIso).getTime();
    if (
      isNaN(startMs) ||
      isNaN(endMs) ||
      endMs - startMs !== durationMinutes * 60000
    ) {
      return jsonOutput_({
        ok: false,
        code: "INVALID_TIME",
        error: "Invalid meeting start or end timestamp.",
      });
    }

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
    return jsonOutput_({
      ok: false,
      code: "BOOKING_ERROR",
      error: String((err && err.message) || err),
    });
  } finally {
    lock.releaseLock();
  }
}
