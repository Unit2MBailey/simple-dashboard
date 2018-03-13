import _ from "lodash";
import request from "superagent-bluebird-promise";
import Source from "./Source";

export default class Jenkins extends Source {
    constructor(data) {
        super(data);
        this.job = data.job;
        this.branch = data.branch;
        this.jobLink = "http://build.ws.u2g:9090/job/Game/job/" + this.job + "/job/" + this.branch;
    }

    fetchData() {
		var url = this.jobLink + "/lastBuild/api/json";
		alert(url);
        return request.get(url)
            .promise()
            .catch(e => e);
    }

    getStatus() {
        return this.fetchData().then(response => {
            var status = "success";
            var messages = [];
			
			alert('Got response from Jenkins: ' + JSON.stringify(response));

            if (!response || !response.body || !response.body.result) {
                status = "danger";
                messages.push({
                    name: "No response from Status.io API"
                });
            } else {
                var worstStatusCode = 0;
                _.forEach(response.body.result.status, s => {
                    _.forEach(s.containers, c => {
                        if (c.status_code > 100) {
                            messages.push({
                                name: s.name,
                                detailName: c.name,
                                message: c.status
                            });

                            if (c.status_code > worstStatusCode) {
                                worstStatusCode = c.status_code;
                            }
                        }
                    });
                });

                // http://kb.status.io/developers/status-codes
                if (worstStatusCode >= 500) {
                    status = "danger";
                } else if (worstStatusCode >= 300) {
                    status = "warning";
                }
            }

            return {
                title: this.job + "/" + this.branch,
                link: this.jobLink,
                status: status,
                messages: messages
            };
        });
    }
}

Jenkins.type = "jenkins";