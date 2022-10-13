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
