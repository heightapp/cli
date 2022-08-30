const output = (...messages: Array<string>) => {
  for (let i = 0; i < messages.length; i++) {
    // eslint-disable-next-line no-console
    console.log(messages[i]);
  }
};

export default output;
