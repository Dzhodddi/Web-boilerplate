import { randomUserMock, additionalUsers } from "./FE4U-Lab2-mock";

const capitalizeFirstLetter = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phonePatterns = {
    Germany: /^[0-9\-\s\(\)\/]+$/,
    Ireland: /^[0-9\-\s]+$/,
    Australia: /^[0-9\-\s\(\)]+$/,
    "United States": /^\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/,
    Finland: /^[0-9\-\s]+$/,
    Turkey: /^\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/,
    Switzerland: /^[0-9\s]+$/,
    "New Zealand": /^\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/,
    Spain: /^[0-9\-\s]+$/,
    Norway: /^[0-9\s]{8,}$/,
    Denmark: /^[0-9\s]{8,}$/,
    Iran: /^[0-9\-\s]+$/,
    Canada: /^[0-9\-\s]+$/,
    France: /^[0-9\-\s]+$/,
    Netherlands: /^\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/
  };

const courses = ['Mathematics', 'Physics', 'English', 'Computer Science','Dancing', 'Chess', 'Biology', 'Chemistry','Law', 'Art', 'Medicine', 'Statistics'];

const getRandomCourse = () => courses[Math.floor(Math.random() * courses.length)];

export const formatUser = (user) => {
    if (!user) return null;
  
    return {
      id: (user.login && user.login.uuid) ? user.login.uuid : null,
      gender: capitalizeFirstLetter(user.gender),
      title: (user.name && user.name.title) ? user.name.title : null,
      full_name: user.name ? `${user.name.first} ${user.name.last}` : null,
      city: (user.location && user.location.city) ? user.location.city : null,
      state: (user.location && user.location.state) ? user.location.state : null,
      country: (user.location && user.location.country) ? user.location.country : null,
      postcode: (user.location && user.location.postcode != null) ? user.location.postcode : null,
      coordinates: (user.location && user.location.coordinates) ? user.location.coordinates : null,
      timezone: (user.location && user.location.timezone) ? user.location.timezone : null,
      email: user.email || null,
      b_day: (user.dob && user.dob.date) ? user.dob.date : null,
      age: (user.dob && user.dob.age != null) ? user.dob.age : null,
      phone: user.phone || null,
      picture_large: (user.picture && user.picture.large) ? user.picture.large : null,
      picture_thumbnail: (user.picture && user.picture.thumbnail) ? user.picture.thumbnail : null,
      favorite: false,
      course: getRandomCourse(),
      bg_color: "#aaaaaa",
      note: "Notes",
    };
  };

export const formatExtraUser = (user) => {
    if (!user) return null;
  
    let age = user.age;
    if (age === undefined && user.b_day) {
        const birthYear = new Date(user.b_day).getFullYear();
        age = new Date().getFullYear() - birthYear;
    }
  
    const generatedId = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Date.now() + Math.random());
  
    return {
        id: user.id || generatedId,
        gender: capitalizeFirstLetter(user.gender),
        title: user.title || null,
        full_name: user.full_name || null,
        city: user.city || null,
        state: user.state || null,
        country: user.country || null,
        postcode: user.postcode != null ? user.postcode : null,
        coordinates: user.coordinates || null,
        timezone: user.timezone || null,
        email: user.email || null,
        b_day: user.b_day || null,
        age: age != null ? age : null,
        phone: user.phone || null,
        picture_large: user.picture_large || null,
        picture_thumbnail: user.picture_thumbnail || null,
        favorite: typeof user.favorite === "boolean" ? user.favorite : false,
        course: user.course || getRandomCourse(),
        bg_color: user.bg_color || "#ffffff",
        note: user.note ? capitalizeFirstLetter(user.note) : "Additional note"
    };
};

export function mergeUsers(...userLists) {
    const mergedMap = new Map();
  
    userLists.flat().forEach((user) => {
        if (!user) return;

        const key = (user.email && user.email.toLowerCase()) || (user.full_name && user.full_name.toLowerCase());

        if (key && !mergedMap.has(key)) {
        mergedMap.set(key, user);
        }
    });
  
    return Array.from(mergedMap.values());
  }

export function formatAndMergeUsers(rawUsers = [], extraUsers = []) {
    const formattedRaw = rawUsers.map(formatUser);
    const formattedExtra = extraUsers.map(formatExtraUser);
    return mergeUsers(formattedRaw, formattedExtra);
}

export const validateUser = (user) => {
    if (!user || typeof user !== "object") 
        return false;

    const isCapitalizedString = (val) =>
        typeof val === "string" && val.trim().length > 0 && /^[A-ZА-ЯІЇЄҐ]/.test(val.trim());

    const stringFields = ["full_name", "gender", "note", "state", "city", "country"];

    for (const field of stringFields) {
        if (!isCapitalizedString(user[field])) 
            return false;
    }

    if (typeof user.age !== "number" || isNaN(user.age) || user.age < 0) {
        return false;
    }

    if (typeof user.email !== "string" || !emailRegex.test(user.email)) {
        return false;
    }

    if (typeof user.phone !== "string") return false;

    const pattern = phonePatterns[user.country];
    if (pattern && !pattern.test(user.phone.trim())) {
        return false;
    }

    return true;
}

export function filterUsers(users = [], filters = {}) {
    return users.filter((user) => {
        return Object.entries(filters).every(([key, filterValue]) => {
            if (filterValue === undefined || filterValue === null) return true;

            if (typeof filterValue === "string")
                return String(user[key] || "").toLowerCase() === filterValue.toLowerCase();

            return user[key] === filterValue;
        });
    });
}


export function sortUsers(users = [], sortBy = "full_name", order = "asc") {
    const allowedFields = ["full_name", "age", "b_day", "country"];
    if (!allowedFields.includes(sortBy))
        throw new Error(`Invalid sort field. Choose one of: ${allowedFields.join(", ")}`);
    
  
    const factor = order.toLowerCase() === "desc" ? -1 : 1;
  
    return [...users].sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];

        if (valA == null) return 1;
        if (valB == null) return -1;

        if (sortBy === "age") {
            return (valA - valB) * factor;
        }

        if (sortBy === "b_day") {
            return (new Date(valA) - new Date(valB)) * factor;
        }

        return String(valA).localeCompare(String(valB)) * factor;
    });
}

export function findUser(users = [], query) {
    if (query === undefined || query === null) return null;
  
    return users.find((user) => {
        if (typeof query === "number")
            return user.age === query;
  
        const searchStr = String(query).toLowerCase();
        const matchName = user.full_name && user.full_name.toLowerCase().includes(searchStr);
        const matchNote = user.note && user.note.toLowerCase().includes(searchStr);

        return Boolean(matchName || matchNote);
    }) || null;
}


export function calculateUserPercentage(users = [], predicate) {
    if (!Array.isArray(users) || users.length === 0) return 0;
    if (typeof predicate !== "function")
        throw new TypeError("Predicate must be a function");
    
  
    const count = users.filter(predicate).length;
    const percentage = (count / users.length) * 100;
  
    return Number(percentage.toFixed(2));
}