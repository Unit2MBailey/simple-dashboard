library('websystems-pipeline-library') _

pipeline {
    agent none
    options {
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '50'))
    }

    stages {
        stage('Build docker container'){
            agent {
                label 'docker-deploy-agent'
            }

            steps {
                buildAndPushDocker(
                    image : 'unit2games/projectzero/simple_dashboard',
                    imageTags : getTagImages("${env:BUILD_ID}", "${env.BRANCH_NAME}"),
                    host : 'build.ws.u2g:10.10.10.50'
                )
            }
	    }

    }
    post {
        always {

            echo 'always'
        }
        success {
            echo 'I succeeeded!'

            script{

            }

        }
        unstable {
            echo 'I am unstable :/'
        }
        failure {
            script {
                if (env.BRANCH_NAME == 'master') {
                    slackSend color: "danger", channel: "#backend_ci_failures", message: "Build failure: ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
                }
            }
        }
    }
}

