<template>
  <div class="modal-body">
    <div v-if="step === 1">
      <h3>Step 1 of 3: Sponsor</h3>
      <transaction
        :hash="sponsorTxHash"
        :error="sponsorTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 2">
      <h3>Step 2 of 3: Verification</h3>
      <div>
        Please scan the QR code or open the link with your BrightID app.
        <br>
        Verification of your account may take a few minutes.
      </div>
      <img :src="appLinkQrCode" class="qr-code">
      <div>
        <a :href="appLink" target="_blank">{{ appLink }}</a>
      </div>
    </div>
    <div v-if="step === 3">
      <h3>Step 3 of 3: Register</h3>
      <transaction
        :hash="registrationTxHash"
        :error="registrationTxError"
        @close="$emit('close')"
      ></transaction>
    </div>
    <div v-if="step === 4">
      <h3>Success!</h3>
      <div>You have successfully verified your account.</div>
      <button class="btn close-btn" @click="$emit('close')">OK</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import QRCode from 'qrcode'

import {
  isSponsoredUser,
  selfSponsor,
  getBrightIdLink,
  getVerification,
  registerUser,
} from '@/api/bright-id'
import Transaction from '@/components/Transaction.vue'
import { LOAD_USER_INFO } from '@/store/action-types'
import { waitForTransaction } from '@/utils/contracts'

@Component({
  components: {
    Transaction,
  },
})
export default class BrightIdModal extends Vue {

  step = 1

  appLink = ''
  appLinkQrCode = ''

  sponsorTxHash = ''
  sponsorTxError = ''
  registrationTxHash = ''
  registrationTxError = ''

  mounted() {
    this.register()
  }

  private async register() {
    const { userRegistryAddress } = this.$store.state.currentRound
    const currentUser = this.$store.state.currentUser
    const signer = currentUser.walletProvider.getSigner()
    // Self-sponsoring
    const isSponsored = await isSponsoredUser(userRegistryAddress, currentUser.walletAddress)
    if (!isSponsored) {
      try {
        await waitForTransaction(
          selfSponsor(userRegistryAddress, signer),
          (hash) => this.sponsorTxHash = hash,
        )
      } catch (error) {
        this.sponsorTxError = error.message
        return
      }
    }
    this.step += 1
    // Verification
    this.appLink = getBrightIdLink(currentUser.walletAddress)
    this.appLinkQrCode = await QRCode.toDataURL(this.appLink)
    const verification = await getVerification(currentUser.walletAddress)
    this.step += 1
    // Registration
    try {
      await waitForTransaction(
        registerUser(userRegistryAddress, verification, signer),
        (hash) => this.registrationTxHash = hash,
      )
    } catch (error) {
      this.registrationTxError = error.message
      return
    }
    this.$store.dispatch(LOAD_USER_INFO)
    this.step += 1
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.qr-code {
  margin: 15px 0;
  max-height: 150px;
}

.close-btn {
  margin-top: 20px;
}
</style>
