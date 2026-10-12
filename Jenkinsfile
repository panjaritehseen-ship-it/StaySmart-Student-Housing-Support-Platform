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
                    icacls "$env:EC2_KEY" /inheritance:r
                    if ($LASTEXITCODE -ne 0) {
                        throw "Could not configure SSH key permissions."
                    }

                    icacls "$env:EC2_KEY" /grant:r "$($identity):(R)"
                    if ($LASTEXITCODE -ne 0) {
                        throw "Could not grant Jenkins access to SSH key."
                    }

                    # Confirm the local Docker image exists.
                    docker image inspect staysmart:1.0
                    if ($LASTEXITCODE -ne 0) {
                        throw "Local image staysmart:1.0 was not found."
                    }

                    # Export the Docker image.
                    docker save -o "$imageFile" staysmart:1.0
                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image export failed."
                    }

                    if (!(Test-Path $imageFile)) {
                        throw "Docker archive was not created."
                    }

                    Write-Host "Local archive:"
                    Get-Item $imageFile | Select-Object Name, Length

                    # Copy to the EC2 user's home directory.
                    scp -i "$env:EC2_KEY" `
                        -o StrictHostKeyChecking=accept-new `
                        -o ConnectTimeout=20 `
                        "$imageFile" `
                        "$($env:EC2_USER)@$($env:EC2_HOST):staysmart.tar"

                    if ($LASTEXITCODE -ne 0) {
                        throw "SCP transfer failed."
                    }

                    # Verify the file, load the image, and deploy.
                    $remoteCommand = 'set -e; echo "Remote user: $USER"; echo "Home: $HOME"; ls -lh "$HOME/staysmart.tar"; test -s "$HOME/staysmart.tar"; sudo docker load -i "$HOME/staysmart.tar"; (sudo docker rm -f staysmart >/dev/null 2>&1 || true); sudo docker run -d --name staysmart --restart unless-stopped -p 80:80 staysmart:1.0; sudo docker ps --filter name=staysmart; sudo rm -f "$HOME/staysmart.tar"'

                    ssh -i "$env:EC2_KEY" `
                        -o StrictHostKeyChecking=accept-new `
                        -o ConnectTimeout=20 `
                        "$($env:EC2_USER)@$($env:EC2_HOST)" `
                        $remoteCommand

                    if ($LASTEXITCODE -ne 0) {
                        throw "EC2 transfer verification or deployment failed."
                    }

                    Write-Host "StaySmart deployment completed successfully."
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