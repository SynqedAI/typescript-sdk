// Why Sleep Exists
//Retry flow needs: wait before retrying

//Example
// 1st attempt failed, retry in 100ms
// 2nd attempt failed, retry in 200ms

export async function sleep(
    ms: number,
  ): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, ms),
    );
  }