/**
 *
 * @param {number} timestamp
 * @returns {string} formattedTime
 */

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return (
    ('0' + date.getHours()).slice(-2) +
    ':' +
    ('0' + date.getMinutes()).slice(-2) +
    ':' +
    ('0' + date.getSeconds()).slice(-2)
  );
}
/**
 *
 * @param {string} id
 * @returns string trimmedId
 */
export function formatTxId(id) {
  return id.length > 10 ? id.slice(0, 5) + '…' + id.slice(-5) : id;
}

/**
 *
 * @param {'fb' | 'linkedin' | 'twitter' | 'whatsapp'} to
 */
export function openShareWindow(url) {
  const configWindow = createWindowConfig();
  return window.open(url, 'Share this', configWindow);
}

/**
 *
 * @param {number} width
 * @param {number} height
 * @returns
 */
function createWindowConfig(width = 500, height = 500) {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `width=${width},height=${height},left=${left},top=${top}`;
}
