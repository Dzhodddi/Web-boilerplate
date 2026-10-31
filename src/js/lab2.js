import _ from "lodash";

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
      id: _.get(user, "login.uuid", null),
      gender: capitalizeFirstLetter(user.gender),
      title: _.get(user, "name.title", null),
      full_name: user.name ? `${user.name.first} ${user.name.last}` : null,
      city: _.get(user, "location.city", null),
      state: _.get(user, "location.state", null),
      country: _.get(user, "location.country", null),
      postcode: _.get(user, "location.postcode", null),
      coordinates: _.get(user, "location.coordinates", null),
      timezone: _.get(user, "location.timezone", null),
      email: user.email || null,
      b_day: _.get(user, "dob.date", null),
      age: _.get(user, "dob.age", null),
      phone: user.phone || null,
      picture_large: _.get(user, "picture.large", null),
      picture_thumbnail: _.get(user, "picture.thumbnail", null),
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
    const formattedRaw = _.map(rawUsers, formatUser);
    const formattedExtra = _.map(extraUsers, formatExtraUser);
    return mergeUsers(formattedRaw, formattedExtra);
}

export const validateUser = (user) => {
    if (!_.isObject(user)) 
        return false;

    const isCapitalizedString = (val) =>
        _.isString(val) && /^[A-ZА-ЯІЇЄҐ]/.test(_.trim(val));

    const stringFields = ["full_name", "gender", "note", "state", "city", "country"];

    if (!_.every(stringFields, (field) => isCapitalizedString(user[field]))) {
        return false;
    }

    if (!_.isFinite(user.age) || user.age < 0) {
        return false;
    }

    if (!_.isString(user.email) || !emailRegex.test(user.email)) {
        return false;
    }

    if (!_.isString(user.phone)) return false;

    const pattern = phonePatterns[user.country];
    return !pattern || pattern.test(_.trim(user.phone));
}

export function filterUsers(users = [], filters = {}) {
    return _.filter(users, (user) =>
        _.every(filters, (filterValue, key) => {
            if (_.isNil(filterValue)) return true;

            if (_.isString(filterValue))
                return _.toLower(user[key]) === _.toLower(filterValue);

            return user[key] === filterValue;
        })
    );
}


export function sortUsers(users = [], sortBy = "full_name", order = "asc") {
    const allowedFields = ["full_name", "age", "b_day", "country", "course"];
    if (!_.includes(allowedFields, sortBy))
        throw new Error(`Invalid sort field. Choose one of: ${allowedFields.join(", ")}`);
    
    const getValue = (user) => {
        const val = user[sortBy];
        if (sortBy === "age") return val;
        if (sortBy === "b_day") return new Date(val).getTime();
        return _.deburr(_.toLower(val));
    };

    return _.orderBy(
        users,
        [(user) => _.isNil(user[sortBy]), getValue],
        ["asc", _.toLower(order) === "desc" ? "desc" : "asc"]
    );
}

export function findUser(users = [], query) {
    if (_.isNil(query)) return null;
  
    return _.find(users, (user) => {
        if (_.isNumber(query))
            return user.age === query;
  
        const searchStr = _.toLower(query);
        return _.includes(_.toLower(user.full_name), searchStr)
            || _.includes(_.toLower(user.note), searchStr);
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