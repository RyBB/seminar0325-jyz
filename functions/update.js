const { KintoneRestAPIClient } = require("@kintone/rest-api-client");

const client = new KintoneRestAPIClient({
  baseUrl: process.env.KINTONE_URL,
  auth: {
    apiToken: process.env.KINTONE_API_TOKEN,
  },
});

exports.handler = async function (context, event, callback) {
  try {
    const response = new Twilio.Response();
    response.appendHeader("Access-Control-Allow-Origin", "*");

    const appId = event.appId;
    const recordId = event.recordId;
    const userId = event.userId;
    const status = event.status == "0" ? "承認" : "否認";
    const reason = event.reason || `認めない！`;

    // 否認だったら否認内容をレコードコメントに残す処理
    if (status === "否認") {
      await client.record.addRecordComment({
        app: appId,
        record: recordId,
        comment: {
          text: `申請が否認されました。メッセージをご確認ください。\n=====\n\n${reason}`,
          mentions: [
            {
              code: userId,
              type: "USER",
            },
          ],
        },
      });
    }

    // 現在の作業者を空にする処理
    await client.record.updateRecordAssignees({
      app: appId,
      id: recordId,
      assignees: [],
    });

    // ステータスを更新する処理
    await client.record.updateRecordStatus({
      app: appId,
      id: recordId,
      action: status,
    });

    response.setBody(
      JSON.stringify({
        body: "OK",
      }),
    );
    callback(null, response);
  } catch (err) {
    console.log(err);
    response.setBody(err.message);
    callback(null, response);
  }
};
