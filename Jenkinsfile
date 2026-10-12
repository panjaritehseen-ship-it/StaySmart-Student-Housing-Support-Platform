pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
    }

    environment {
        DOCKER_IMAGE = 'asd10staysmart/staysmart:latest'
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
                        throw "Node.js is required on the Jenkins agent."
                    }

                    if ($nodeVersion -notmatch '^v(\\d+)\\.') {
                        throw "Could not parse Node.js version: $nodeVersion"
                    }

                    $nodeMajor = [int]$Matches[1]
                    if ($nodeMajor -lt 18) {
                        throw "Node.js 18 or newer is required. Found: $nodeVersion"
                    }

                    Write-Host "Using Node.js $nodeVersion"
                '''
            }
        }

        stage('Verify Project Files') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $requiredFiles = @(
                        "index.html",
                        "vendor.html",
                        "admin.html",
                        "css/style.css",
                        "js/data.js",
                        "js/panel.js",
                        "js/app.js",
                        "js/vendor.js",
                        "js/admin.js",
                        "tests/staysmart.test.js",
                        "images/properties/bedroom.jpg"
                    )

                    foreach ($file in $requiredFiles) {
                        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
                            throw "Missing required project file: $file"
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
                        "js/data.js",
                        "js/panel.js",
                        "js/app.js",
                        "js/vendor.js",
                        "js/admin.js",
                        "tests/staysmart.test.js"
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
                '''
            }
        }

 
        stage('Docker Hub Push') {
            steps {
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
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

                            $token | docker login `
                                --username $env:DOCKERHUB_USER `
                                --password-stdin

                            if ($LASTEXITCODE -ne 0) {
                                throw "Docker Hub login failed."
                            }

                            docker tag staysmart:1.0 $env:DOCKER_IMAGE
                            if ($LASTEXITCODE -ne 0) {
                                throw "Docker image tagging failed."
                            }

                            docker push $env:DOCKER_IMAGE
                            if ($LASTEXITCODE -ne 0) {
                                throw "Docker image push failed."
                            }

                            Write-Host "Docker image pushed successfully."
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
                        $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

                        try {
                            # Restrict access to Jenkins' temporary private key.
                            icacls "$env:EC2_KEY" /inheritance:r
                            if ($LASTEXITCODE -ne 0) {
                                throw "Could not disable inherited SSH-key permissions."
                            }

                            icacls "$env:EC2_KEY" /grant:r "$($identity):(R)"
                            if ($LASTEXITCODE -ne 0) {
                                throw "Could not grant Jenkins read access to the SSH key."
                            }

                            # Export the image already built by Jenkins.
                            docker save -o "$imageFile" staysmart:1.0
                            if ($LASTEXITCODE -ne 0) {
                                throw "Docker image export failed."
                            }

                            # Copy the image archive to EC2.
                            scp -i "$env:EC2_KEY" `
                                -o StrictHostKeyChecking=accept-new `
                                -o ConnectTimeout=15 `
                                "$imageFile" `
                                "$($env:EC2_USER)@$($env:EC2_HOST):/tmp/staysmart.tar"

                            if ($LASTEXITCODE -ne 0) {
                                throw "Image transfer to EC2 failed."
                            }

                            # Load the image and replace the container.
                            $remoteScript = @'
set -e
sudo docker load -i /tmp/staysmart.tar
sudo docker rm -f staysmart 2>/dev/null || true
sudo docker run -d --name staysmart --restart unless-stopped -p 80:80 staysmart:1.0
sudo docker ps --filter name=staysmart
sudo rm -f /tmp/staysmart.tar
'@

                            $remoteScript | ssh `
                                -i "$env:EC2_KEY" `
                                -o StrictHostKeyChecking=accept-new `
                                -o ConnectTimeout=15 `
                                "$($env:EC2_USER)@$($env:EC2_HOST)" `
                                "bash -s"

                            if ($LASTEXITCODE -ne 0) {
                                throw "EC2 deployment failed."
                            }

                            Write-Host "EC2 deployment commands completed."
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
            echo 'StaySmart CI/CD: checks passed, image published, and EC2 deployment completed.'
        }

        failure {
            echo 'StaySmart CI/CD failed. Inspect the first failed stage in the console log.'
        }

        always {
            echo 'StaySmart CI/CD pipeline execution completed.'
        }
    }
}