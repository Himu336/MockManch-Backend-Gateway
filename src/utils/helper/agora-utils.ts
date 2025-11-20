// src/utils/helper/agora-utils.ts

import AgoraPkg from "agora-token";

const { RtcTokenBuilder, RtcRole } = AgoraPkg;

export const generateAgoraToken = (
  channelName: string,
  uid: string,
  expireSeconds: number = 3600
): string => {
  const appId = process.env.AGORA_APP_ID;
  const appCert = process.env.AGORA_APP_CERT;

  if (!appId || !appCert) {
    throw new Error("AGORA_APP_ID or AGORA_APP_CERT missing in .env");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCert,
    channelName,
    Number(uid),
    RtcRole.PUBLISHER,
    privilegeExpireTime,
    privilegeExpireTime
  );

  return token;
};
