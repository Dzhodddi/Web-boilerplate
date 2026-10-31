import _ from "lodash";
import dayjs from "dayjs";
import L from "leaflet";
import Chart from "chart.js/auto";
import WebDataRocks from "@webdatarocks/webdatarocks";
import "leaflet/dist/leaflet.css";
import "@webdatarocks/webdatarocks/webdatarocks.min.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const MAP_ZOOM = 5;

const REPORT_COLUMNS = {
  full_name: "Name",
  course: "Speciality",
  age: "Age",
  gender: "Gender",
  country: "Nationality",
  city: "City",
  email: "Email",
  phone: "Phone",
};

const REPORT_SLICES = {
  countries: {
    rows: [{ uniqueName: "country" }],
    columns: [{ uniqueName: "Measures" }],
    measures: [
      { uniqueName: "full_name", aggregation: "count", caption: "Teachers" },
      { uniqueName: "age", aggregation: "average", caption: "Average age", format: "age" },
    ],
  },
  flat: {
    rows: _.map(_.keys(REPORT_COLUMNS), (uniqueName) => ({ uniqueName })),
  },
};

let teacherMap = null;
let teacherMarker = null;
let pieChart = null;
let pivot = null;

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export function daysToNextBirthday(bDay) {
  const birthDate = dayjs(bDay);
  if (!bDay || !birthDate.isValid()) return null;

  const today = dayjs().startOf("day");
  const birthday = birthDate.year(today.year()).startOf("day");
  const next = birthday.isBefore(today) ? birthDate.year(today.year() + 1).startOf("day") : birthday;

  return next.diff(today, "day");
}

function parseCoordinates(coordinates) {
  const lat = Number(_.get(coordinates, "latitude"));
  const lng = Number(_.get(coordinates, "longitude"));
  return coordinates && _.isFinite(lat) && _.isFinite(lng) ? [lat, lng] : null;
}

export function resetTeacherMap(coordinates) {
  const mapEl = document.getElementById("teacher-map");
  const mapLink = document.querySelector(".teacher-map-link");
  if (mapEl) mapEl.hidden = true;
  if (mapLink) mapLink.hidden = !parseCoordinates(coordinates);
}

export function toggleTeacherMap(user) {
  const mapEl = document.getElementById("teacher-map");
  const position = parseCoordinates(user.coordinates);
  if (!mapEl || !position) return;

  mapEl.hidden = !mapEl.hidden;
  if (mapEl.hidden) return;

  if (!teacherMap) {
    teacherMap = L.map(mapEl);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(teacherMap);
    teacherMarker = L.marker(position).addTo(teacherMap);
  }

  teacherMap.invalidateSize();
  teacherMap.setView(position, MAP_ZOOM);
  teacherMarker.setLatLng(position);
}

function getAgeGroup(age) {
  if (!_.isNumber(age)) return "Unknown";
  if (age < 18) return "Under 18";
  if (age <= 31) return "18-31";
  if (age <= 45) return "32-45";
  return "46+";
}

function getChartGroup(user, field) {
  return field === "age" ? getAgeGroup(user.age) : user[field] || "Unknown";
}

export function renderPieChart(users, field) {
  const canvas = document.getElementById("statistics-pie");
  const emptyEl = document.querySelector(".chart-empty");
  if (!canvas) return;

  const counts = _.countBy(users, (user) => getChartGroup(user, field));
  const groups = _.orderBy(_.toPairs(counts), [_.last, _.head], ["desc", "asc"]);

  const data = {
    labels: _.map(groups, _.head),
    datasets: [{
      data: _.map(groups, _.last),
      backgroundColor: _.map(groups, (group, i) => `hsl(${(i * 137.5) % 360}, 60%, 55%)`),
    }],
  };

  if (emptyEl) emptyEl.hidden = !_.isEmpty(users);

  if (pieChart) {
    pieChart.data = data;
    pieChart.update();
    return;
  }

  pieChart = new Chart(canvas, {
    type: "pie",
    data,
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right" },
      },
    },
  });
}

function buildReport(view, users) {
  const fields = _.keys(REPORT_COLUMNS);

  return {
    dataSource: {
      data: _.map(users, (user) => _.mapValues(_.pick(user, fields), (val) => (_.isNil(val) ? "" : val))),
      mapping: _.mapValues(REPORT_COLUMNS, (caption) => ({ caption })),
    },
    slice: REPORT_SLICES[view],
    formats: [{ name: "age", decimalPlaces: 1 }],
    options: {
      grid: {
        type: view === "flat" ? "flat" : "compact",
        showTotals: "off",
        showGrandTotals: view === "flat" ? "off" : "columns",
      },
    },
  };
}

export function renderReport(view, users) {
  const report = buildReport(view, users);

  if (pivot) {
    pivot.setReport(report);
    return;
  }

  pivot = new WebDataRocks({
    container: "#statistics-report",
    width: "100%",
    height: 480,
    toolbar: false,
    report,
  });
}
