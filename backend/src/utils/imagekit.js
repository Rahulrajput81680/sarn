const ImageKit = require('imagekit')

// Object storage for outbound WhatsApp media — Meta needs a publicly-reachable HTTPS URL to
// fetch media from when sending, and Render's local disk is ephemeral (wiped on every
// redeploy/restart), so files saved there don't survive.
const imagekit = new ImageKit({
  publicKey:  process.env.IMAGEKIT_PUBLIC,
  privateKey: process.env.IMAGEKIT_PRIVATE,
  urlEndpoint: process.env.IMAGEKIT_URL,
})

module.exports = imagekit
