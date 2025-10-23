pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                script {
                    sh 'scripts/build.sh'
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    sh 'scripts/test.sh'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh 'scripts/deploy.sh'
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}