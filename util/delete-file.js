const fs = require("fs");

const deleteFile = (filePath) => {
  //unlink is used to delete a file
  fs.unlink(filePath, (err) => {
    if (err) {
      //this error is then caught by the catch block on the place you'll call this fn
      throw (err);
    }
  });
};

exports.deleteFile = deleteFile;
