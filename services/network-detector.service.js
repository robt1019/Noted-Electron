const net = require("net");

let lastEmitted = false;

let _onChange;

const checkConnection = (onChange) => {
  _onChange = onChange;
  const connection = net.connect(
    {
      port: 80,
      host: "google.com",
    },
    () => {
      if (lastEmitted === false) {
        lastEmitted = true;
        _onChange(true);
      }
    }
  );
  connection.on("error", () => {
    if (lastEmitted === true) {
      lastEmitted = false;
      _onChange(false);
    }
  });
};

const onNetworkChange = (onChange) => {
  checkConnection(onChange);
  setInterval(() => {
    checkConnection(onChange, lastEmitted);
  }, 5000);
};

module.exports = {
  onNetworkChange,
};
