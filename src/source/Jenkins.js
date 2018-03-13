import _ from "lodash";
import request from "superagent-bluebird-promise";
import Source from "./Source";

export default class Jenkins extends Source {
    constructor(data) {
        super(data);
        this.host = data.host;
        this.job = data.job;
        this.branch = data.branch;
        this.jobFolder = data.jobFolder;
		this.jobLink = this.host + "/job/";
		if (this.jobFolder)
			this.jobLink += this.jobFolder + "/job/"
		this.jobLink += this.job;
		if (this.branch)
			this.jobLink += "/job/" + this.branch
    }

    fetchData(urlEnd) {
		var url = this.jobLink + urlEnd;
		console.log(url);
        return request.get(url)
            .promise()
            .catch(e => e);
    }
	
	getLastFailedBuildNumber() {
		return this.fetchData("/lastFailedBuild/buildNumber").then(response => {
			console.log(response.text);
			return (response.ok) ? Number(response.text) : 0;
		})
	}
	
	getLastSuccessfulBuildNumber() {
		return this.fetchData("/lastSuccessfulBuild/buildNumber").then(response => {
			console.log(response.text);
			return (response.ok) ? Number(response.text) : 0;
		})
	}
	
	getLastBuildInfo() {
		return fetchData("/lastBuild/api/json")
	}

    getStatus() {
        return this.getLastFailedBuildNumber().then(lastFailedBuildNumber => {
			this.lastFailedBuildNumber = lastFailedBuildNumber;
		}).then(response => {
			return this.getLastSuccessfulBuildNumber().then(lastSuccessfulBuildNumber => {
				this.lastSuccessfulBuildNumber = lastSuccessfulBuildNumber;
			})
		}).then(response => {
            var status = "success";
            var messages = [];

			if ((this.lastSuccessfulBuildNumber == 0) || (this.lastFailedBuildNumber > this.lastSuccessfulBuildNumber))
			{
				status = "danger";
			}
			
            return {
                title: this.job + " (" + this.branch + ")",
                link: this.jobLink,
                status: status,
                messages: messages
            };
        });
    }
}

Jenkins.type = "jenkins";