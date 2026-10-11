
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
    }

    environment {
        DOCKER_IMAGE = 'asd10staysmart/staysmart'
        DOCKER_TAG = 'latest'
        LOCAL_IMAGE = 'staysmart:1.0'
        EC2_HOST = '13.204.143.193'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check CI Environment') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $nodeVersion = node --version
                    if ($LASTEXITCODE -ne 0) {
                        throw "Node.js is not installed or unavailable."
                    }

                    Write-Host "Using Node.js $nodeVersion"

                    $dockerVersion = docker --version
                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker is not installed or unavailable."
                    }

                    Write-Host $dockerVersion

                    $gitVersion = git --version
                    if ($LASTEXITCODE -ne 0) {
                        throw "Git is not installed or unavailable."
                    }

                    Write-Host $gitVersion
                '''
            }
        }

        stage('Verify Project Files') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $requiredFiles = @(
                        'index.html',
                        'vendor.html',
                        'admin.html',
                        'css/style.css',
                        'js/data.js',
                        'js/panel.js',
                        'js/app.js',
                        'js/vendor.js',
                        'js/admin.js',
                        'tests/staysmart.test.js',
                        'images/properties/bedroom.jpg',
                        'Dockerfile'
                    )

                    foreach ($file in $requiredFiles) {
                        if (-not (Test-Path $file -PathType Leaf)) {
                            throw "Required file missing: $file"
                        }

                        Write-Host "Verified: $file"
                    }
                '''
            }
        }

        stage('JavaScript Syntax Checks') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $jsFiles = @(
                        'js/data.js',
                        'js/panel.js',
                        'js/app.js',
                        'js/vendor.js',
                        'js/admin.js',
                        'tests/staysmart.test.js'
                    )

                    foreach ($file in $jsFiles) {
                        Write-Host "Checking JavaScript syntax: $file"

                        node --check $file
                        if ($LASTEXITCODE -ne 0) {
                            throw "JavaScript syntax check failed: $file"
                        }
                    }

                    Write-Host "All JavaScript files passed syntax checks."
                '''
            }
        }

        stage('Automated Application Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Host "Running StaySmart automated tests..."

                    node tests/staysmart.test.js
                    if ($LASTEXITCODE -ne 0) {
                        throw "StaySmart automated tests failed."
                    }

                    Write-Host "StaySmart test suite passed."
                '''
            }
        }

        stage('Docker Build') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    docker build -t staysmart:1.0 .
                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image build failed."
                    }

                    Write-Host "Docker image built successfully."

                    docker image inspect staysmart:1.0
                    if ($LASTEXITCODE -ne 0) {
                        throw "Built Docker image could not be verified."
                    }
                '''
            }
        }

        stage('Docker Hub Push') {
            steps {
                catchError(
                    buildResult: 'SUCCESS',
                    stageResult: 'UNSTABLE'
                ) {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-creds',
                            usernameVariable: 'DOCKERHUB_USER',
                            passwordVariable: 'DOCKERHUB_TOKEN'
                        )
                    ]) {
                        powershell '''
                            $ErrorActionPreference = 'Stop'

                            $token = $env:DOCKERHUB_TOKEN.Trim()

                            if ([string]::IsNullOrWhiteSpace($token)) {
                                throw "Docker Hub token is empty."
                            }

                            $token | docker login `
                                --username $env:DOCKERHUB_USER `
                                --password-stdin

                            if ($LASTEXITCODE -ne 0) {
                                throw "Docker Hub login failed."
                            }

                            docker tag staysmart:1.0 `
                                "$($env:DOCKERHUB_USER)/staysmart:latest"

                            if ($LASTEXITCODE -ne 0) {
                                throw "Docker image tagging failed."
                            }

                            docker push `
                                "$($env:DOCKERHUB_USER)/staysmart:latest"

                            if ($LASTEXITCODE -ne 0) {
                                throw "Docker Hub push failed."
                            }

                            Write-Host "Docker Hub push completed successfully."
                        '''
                    }
                }
            }
        }

        stage('Deploy to AWS EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'EC2_KEY',
                        usernameVariable: 'EC2_USER'
                    )
                ]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'

                        $imageFile = Join-Path $env:WORKSPACE 'staysmart.tar'

                        try {
                            # Export the image built locally by Jenkins.
                            docker save -o $imageFile staysmart:1.0

                            if ($LASTEXITCODE -ne 0) {
                                throw "Failed to export the Docker image."
                            }

                            # Transfer the image directly to EC2.
                            scp -i "$env:EC2_KEY" `
                                -o StrictHostKeyChecking=no `
                                $imageFile `
                                "$($env:EC2_USER)@$($env:EC2_HOST):/tmp/staysmart.tar"

                            if ($LASTEXITCODE -ne 0) {
                                throw "Failed to transfer the image to EC2."
                            }

                            # Load and deploy the image on EC2.
                            $deployScript = @'
set -e

sudo docker load -i /tmp/staysmart.tar

sudo docker rm -f staysmart 2>/dev/null || true

sudo docker run -d \
    --name staysmart \
    --restart unless-stopped \
    -p 80:80 \
    staysmart:1.0

sudo docker rm -f staysmart-old 2>/dev/null || true
sudo rm -f /tmp/staysmart.tar

sudo docker ps --filter name=staysmart
'@

                            $deployScript | ssh `
                                -i "$env:EC2_KEY" `
                                -o StrictHostKeyChecking=no `
                                "$($env:EC2_USER)@$($env:EC2_HOST)" `
                                "bash -s"

                            if ($LASTEXITCODE -ne 0) {
                                throw "Deployment on EC2 failed."
                            }

                            Write-Host "StaySmart deployed successfully."
                            Write-Host "Website: http://$($env:EC2_HOST)"
                        }
                        finally {
                            if (Test-Path $imageFile) {
                                Remove-Item $imageFile -Force
                            }
                        }
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'StaySmart CI/CD pipeline completed successfully.'
            echo 'Check the EC2 public IP to verify the deployed website.'
        }

        unstable {
            echo 'Deployment pipeline completed with an unstable stage. Check Docker Hub Push logs; EC2 deployment may still have succeeded.'
        }

        failure {
            echo 'StaySmart CI/CD failed. Check the first failed stage, especially Docker Build or Deploy to AWS EC2.'
        }

        always {
            echo 'StaySmart CI/CD pipeline execution completed.'
        }
    }
}
