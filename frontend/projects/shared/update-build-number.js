const fs = require('fs');
const path = require('path');

const updateVersionFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    const version = require(filePath);
    const [major, minor, patch] = version.buildNumber.split('.').map(Number);
    const newBuildNumber = `${major}.${minor}.${patch + 1}`;

    const updatedVersion = {
      buildNumber: newBuildNumber
    };

    fs.writeFileSync(filePath, JSON.stringify(updatedVersion, null, 2));
    console.log(`Build number updated to ${newBuildNumber} in ${filePath}`);
  } else {
    console.error(`Version file not found at ${filePath}`);
  }
};


updateVersionFile(path.resolve(__dirname, '../admin/src/assets/version.json'));
updateVersionFile(path.resolve(__dirname, '../ganna/src/assets/version.json'));
updateVersionFile(path.resolve(__dirname, '../report/src/assets/version.json'));
updateVersionFile(path.resolve(__dirname, '../public/src/assets/version.json'));
updateVersionFile(path.resolve(__dirname, '../society/src/assets/version.json'));
updateVersionFile(path.resolve(__dirname, '../tehsil/src/assets/version.json'));
