<script setup lang="ts">
const props = defineProps<{
  url: string;
}>();

const message =
  'I just played a game of rock-paper-scissors on the æternity blockchain.\n';

const twitterΜessage =
  message.replace('æternity', '@aeternity') +
  '#Æ #æternity #AE #aeternityblockchain #web3 #blockchaintechnology\n';

const fbUrl = `https://www.facebook.com/sharer/sharer.php?&u=${encodeURIComponent(
  props.url
)}`;
const linkedInUrl = `https://www.linkedin.com/shareArticle?url=${encodeURIComponent(
  props.url
)}`;
const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
  twitterΜessage
)}&url=${encodeURIComponent(props.url)}`;
const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
  message + props.url
)}`;

function openShareWindow(to: 'fb' | 'linkedin' | 'twitter' | 'whatsapp') {
  const configWindow = createWindowConfig();
  let url;
  switch (to) {
    case 'fb':
      url = fbUrl;
      break;
    case 'linkedin':
      url = linkedInUrl;
      break;
    case 'twitter':
      url = twitterUrl;
      break;
    case 'whatsapp':
      url = whatsappUrl;
      break;
  }
  return window.open(url, 'Share this', configWindow);
}

function createWindowConfig(width = 500, height = 500, params = '') {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `width=${width},height=${height},left=${left},top=${top},${params}`;
}
</script>

<template>
  <div class="share-buttons">
    <span class="text">Share your results </span>
    <div class="button" @click="openShareWindow('fb')">
      <img src="../../assets/svg/facebook.svg" alt="Facebook" />
    </div>
    <div class="button" @click="openShareWindow('linkedin')">
      <img src="../../assets/svg/linkedin.svg" alt="LinkedIn" />
    </div>
    <div class="button" @click="openShareWindow('twitter')">
      <img src="../../assets/svg/twitter.svg" alt="Twitter" />
    </div>
    <div class="button" @click="openShareWindow('whatsapp')">
      <img src="../../assets/svg/whatsapp.svg" alt="WhatsApp" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../mediaqueries.scss';

.share-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  @include for-phone-only {
    flex-wrap: wrap;
    max-width: 230px;
  }
}

.text {
  margin-right: 10px;
  font-size: 25px;
  font-weight: 400;
  @include for-phone-only {
    flex-basis: 100%;
    margin-bottom: 10px;
  }
}

.button {
  margin-right: 10px;
  font-size: 16px;
  font-weight: 400;
  border: none;
  user-select: none;
  cursor: pointer;
  text-align: center;
  transition: transform 50ms ease-in-out;
  text-decoration: none;

  img {
    width: 40px;
    height: 40px;
  }

  &:hover {
    transform: scale(1.1);
  }

  @include for-phone-only {
    font-size: 24px;
  }
}
</style>
