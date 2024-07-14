export function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err === null) {
        resolve(this);
      } else {
        reject(err);
      }
    });
  });
}

export function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err === null) {
        resolve(row);
      } else {
        reject(err);
      }
    });
  });
}

export function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, row) => {
      if (err === null) {
        resolve(row);
      } else {
        reject(err);
      }
    });
  });
}
