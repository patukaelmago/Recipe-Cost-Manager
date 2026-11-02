import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

export const getSucreToken = onRequest(
  {region: "us-central1"},
  async (req, res) => {
    try {
      const token = await admin.auth().createCustomToken("sucre-direct", {
        tenantId: "sucre",
      });

      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json({token});
    } catch (error: unknown) {
      console.error("ERROR TOKEN:", error);

      const message =
        error instanceof Error ? error.message : "Unknown error";

      res.status(500).json({error: message});
    }
  }
);
