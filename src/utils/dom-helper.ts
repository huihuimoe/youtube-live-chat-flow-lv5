export const querySelectorAsync = <T extends Element = Element>(
  selector: string,
  interval = 100,
  timeout = 1000,
) => {
  return new Promise<T | null>((resolve) => {
    const expireTime = Date.now() + timeout
    const timer = window.setInterval(() => {
      const e = document.querySelector<T>(selector)
      if (e || Date.now() > expireTime) {
        clearInterval(timer)
        resolve(e)
      }
    }, interval)
  })
}

export const getImageSourceAsync = (img: HTMLImageElement, timeout = 1000) => {
  return new Promise<string>((resolve) => {
    const source = img.currentSrc || img.src
    if (source) {
      resolve(source)
      return
    }

    const cleanup = () => {
      observer.disconnect()
      clearTimeout(timer)
      img.removeEventListener('load', complete)
      img.removeEventListener('error', complete)
    }
    const complete = () => {
      cleanup()
      resolve(img.currentSrc || img.src)
    }
    const observer = new MutationObserver(() => {
      if (img.currentSrc || img.src) {
        complete()
      }
    })
    const timer = window.setTimeout(complete, timeout)

    observer.observe(img, { attributes: true, attributeFilter: ['src'] })
    img.addEventListener('load', complete, { once: true })
    img.addEventListener('error', complete, { once: true })
  })
}

export const waitImageLoaded = (img: HTMLImageElement, timeout = 1000) => {
  return new Promise<string>((resolve) => {
    if (img.complete && img.naturalWidth) {
      resolve(img.currentSrc || img.src)
      return
    }

    const cleanup = () => {
      clearTimeout(timer)
      img.removeEventListener('load', complete)
      img.removeEventListener('error', complete)
    }
    const complete = () => {
      cleanup()
      resolve(img.currentSrc || img.src)
    }
    const timer = window.setTimeout(complete, timeout)

    img.addEventListener('load', complete, { once: true })
    img.addEventListener('error', complete, { once: true })
  })
}

const needsLayoutImageWait = (img: HTMLImageElement) => !img.style.width

export const waitLayoutImagesLoaded = (
  element: HTMLElement,
  timeout = 1000,
) => {
  if (element instanceof HTMLImageElement) {
    return needsLayoutImageWait(element)
      ? Promise.all([waitImageLoaded(element, timeout)])
      : Promise.all([])
  }
  return Promise.all(
    Array.from(element.querySelectorAll('img'))
      .filter(needsLayoutImageWait)
      .map((img) => {
        return waitImageLoaded(img, timeout)
      }),
  )
}
