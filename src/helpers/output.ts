const output = (...messages: Array<string>) => {
  for (let i = 0; i < messages.length; i++) {
    console.log(messages[i]);
  }
}

export default output;
