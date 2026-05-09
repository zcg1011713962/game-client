// =========================
// Http.ts
// Cocos Creator 2.4.x
// =========================

export default class Http {

    static post<T>(
        url: string,
        data: any,
        callback: (err: any, res?: T) => void
    ) {

        const xhr = new XMLHttpRequest();

        xhr.open("POST", url, true);

        xhr.setRequestHeader(
            "Content-Type",
            "application/json;charset=UTF-8"
        );

        xhr.onreadystatechange = function () {

            if (xhr.readyState !== 4) {
                return;
            }

            if (xhr.status >= 200 && xhr.status < 300) {

                try {

                    const res = JSON.parse(xhr.responseText);

                    callback(null, res);

                } catch (e) {

                    callback(e);
                }

            } else {

                callback(`HTTP ERROR : ${xhr.status}`);
            }
        };

        xhr.onerror = function () {
            callback("NETWORK ERROR");
        };

        xhr.timeout = 10000;

        xhr.ontimeout = function () {
            callback("REQUEST TIMEOUT");
        };

        xhr.send(JSON.stringify(data || {}));
    }
}