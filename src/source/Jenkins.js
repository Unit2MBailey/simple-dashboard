import _ from "lodash";
import moment from "moment";
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
		this.expectedAgeHours = data.expectedAgeHours ? data.expectedAgeHours : 2
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
	
	getLastCompletedBuildInfo() {
		return this.fetchData("/lastCompletedBuild/api/json").then(response => {
			// console.log(response.text);
			return (response.ok) ? response.body : undefined;
		})
	}

    getStatus() {
		
		var p1 = this.getLastCompletedBuildInfo()
		var p2 = this.getLastSuccessfulBuildNumber()
		var p3 = this.getLastFailedBuildNumber()
		
        return Promise.all([p1,p2,p3]).then(promiseValues => {
			var lastCompletedBuildInfo = promiseValues[0];
			var lastSuccessfulBuildNumber = promiseValues[1];
			var lastFailedBuildNumber = promiseValues[2];

            var status = "success";
            var messageStrings = [];
			var title = this.job.replace("Game-", "")
			
			if ((lastSuccessfulBuildNumber == 0) || (lastFailedBuildNumber > lastSuccessfulBuildNumber))
			{
				status = "danger";
			}
			var timeAgo = "";
			if (lastCompletedBuildInfo)
			{
				title += " (" + lastCompletedBuildInfo.number.toString() + ")"
			
				var finishedTime = lastCompletedBuildInfo.timestamp + lastCompletedBuildInfo.duration;			
				var hoursAgo = (Date.now() - finishedTime) / 3600000;
				if (hoursAgo > this.expectedAgeHours)
				{
					messageStrings.push(moment(finishedTime).fromNow())
				}
				
				// Check for test results in the build display name, and show those too
				var testResults = lastCompletedBuildInfo.displayName.match( /Tests-\d+\/\d+/g )
				if (testResults)
				{
					messageStrings.push(testResults[0])
				}
				
				var failedMatch = lastCompletedBuildInfo.description.match(/'([^']*)' FAILED/)
				if (failedMatch)
				{
					messageStrings.push("'" + failedMatch[1] + "' FAILED")
				}
			}
			else
			{
				messageStrings.push("Pending");
			}
			
            return {
                title: title,
                link: this.jobLink,
                status: status,
                messages: messageStrings ? [{ message:messageStrings.join(" - ")}] : []
            };
        });
    }
}

Jenkins.type = "jenkins";