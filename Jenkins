pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/opt/homebrew/bin:${env.PATH}"
    }

    tools {
        nodejs 'NodeJS'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Avinash77068/testingtodo.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Docker Check') {
            steps {
                sh '''
                    which docker
                    docker --version
                    docker ps
                '''
            }
        }

        stage('Docker Build') {
            steps {
                sh 'docker build -t todo-api:latest .'
            }
        }

        stage('Docker Run') {
            steps {
                sh '''
                    docker rm -f todo-api || true
                    docker run -d \
                        --name todo-api \
                        -p 4000:4000 \
                        todo-api:latest
                '''
            }
        }
    }

    post {
        success {
            echo 'Node.js + Docker pipeline completed successfully!'
        }

        failure {
            echo 'Node.js + Docker pipeline failed!'
        }
    }
}
