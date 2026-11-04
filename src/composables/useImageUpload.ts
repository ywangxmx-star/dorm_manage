export function useImageUpload() {
  function chooseImages(max = 9): Promise<string[]> {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count: max,
        success: (res) => {
          const paths = res.tempFilePaths as string[]
          Promise.all(paths.map(p => readAsBase64(p))).then(resolve).catch(reject)
        },
        fail: () => resolve([]),
      })
    })
  }

  function readAsBase64(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      uni.getFileSystemManager().readFile({
        filePath: path,
        encoding: 'base64',
        success: (res) => resolve(res.data as string),
        fail: reject,
      })
    })
  }

  return { chooseImages }
}
