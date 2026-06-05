export default class Http {

    static post<T>(
        url: string,
        data: any,
        callback: (err: any, res?: T) => void,
        headers?: { [key: string]: string }  // 新增 headers 参数
    ) {

        const xhr = new XMLHttpRequest();

        xhr.open("POST", url, true);

        xhr.setRequestHeader(
            "Content-Type",
            "application/json;charset=UTF-8"
        );

        // 设置自定义 headers
        if (headers) {
            for (const key in headers) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;

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