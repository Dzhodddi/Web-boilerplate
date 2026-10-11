import "../scss/style.scss";
import { randomUserMock, additionalUsers } from "./FE4U-Lab2-mock.js";
import {
  formatAndMergeUsers,
  validateUser,
  filterUsers,
  calculateUserPercentage,
} from "./lab2.js";

const users = formatAndMergeUsers(randomUserMock, additionalUsers);
console.log("Total users:", users.length);
console.log("Sample user:", users[0]);
console.log("Validation test:", validateUser(users[0]));
console.log("Filtered:", filterUsers(users, { country: "Germany" }));
console.log("Over 30 %:", calculateUserPercentage(users, (u) => u.age > 30));
