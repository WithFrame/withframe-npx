// Asks for a single-key yes/no confirmation in interactive terminals.
export const confirm = async (question: string): Promise<boolean> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return false;
  }

  return new Promise((resolve) => {
    process.stdout.write(question);

    const handleData = (data: Buffer) => {
      const char = data.toString().toLowerCase();

      if (char === '\u0003') {
        process.exit(); // Ctrl+C
      }

      if (char === 'y') {
        cleanup();
        resolve(true);
      } else if (char === 'n') {
        cleanup();
        resolve(false);
      }
    };

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', handleData);
      process.stdout.write('\n');
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', handleData);
  });
};
