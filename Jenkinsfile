
pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
    }

    environment {
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

                    Write-Host "All automated tests passed."
                '''
            }
        }

        stage('Docker Build') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    docker build -t $env:LOCAL_IMAGE .

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker image build failed."
                    }

                    Write-Host "Docker image built successfully."
                '''
            }
        }

        stage('Save Docker Image') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $imageArchive = Join-Path $env:WORKSPACE 'staysmart.tar'

                    if (Test-Path -LiteralPath $imageArchive) {
                        Remove-Item -LiteralPath $imageArchive -Force
                    }

                    docker save -o $imageArchive $env:LOCAL_IMAGE

                    if ($LASTEXITCODE -ne 0) {
                        throw "Failed to save Docker image."
                    }

                    if (-not (Test-Path -LiteralPath $imageArchive -PathType Leaf)) {
                        throw "Docker image archive was not created."
                    }

                    $archive = Get-Item -LiteralPath $imageArchive

                    if ($archive.Length -eq 0) {
                        throw "Docker image archive is empty."
                    }

                    Write-Host "Docker image saved successfully."
                    Write-Host "Archive size: $($archive.Length) bytes"
                '''
            }
        }

        stage('Transfer Image to AWS EC2') {
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

                        $imageArchive = Join-Path $env:WORKSPACE 'staysmart.tar'
                        $remoteArchive = '/tmp/staysmart.tar'
                        $destination = "$($env:EC2_USER)@$($env:EC2_HOST):$remoteArchive"

                        Write-Host "Checking SSH connection to EC2..."

                        & ssh `
                            -i "$env:EC2_KEY" `
                            -o StrictHostKeyChecking=accept-new `
                            -o ConnectTimeout=15 `
                            "$($env:EC2_USER)@$($env:EC2_HOST)" `
                            "echo EC2 connection successful"

                        if ($LASTEXITCODE -ne 0) {
                            throw "SSH connection to EC2 failed."
                        }

                        Write-Host "Transferring Docker image archive to EC2..."

                        & scp `
                            -i "$env:EC2_KEY" `
                            -o StrictHostKeyChecking=accept-new `
                            -o ConnectTimeout=15 `
                            "$imageArchive" `
                            $destination

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker image transfer to EC2 failed."
                        }

                        Write-Host "Docker image transferred successfully."
                    '''
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

                        # Load the transferred image and replace the old container.
                        # Docker Hub is not required.

                        $remoteCommand = 'docker load -i /tmp/staysmart.tar && (docker rm -f staysmart >/dev/null 2>&1 || true) && docker run -d --name staysmart --restart unless-stopped -p 80:80 staysmart:1.0'

                        Write-Host "Loading image and deploying StaySmart on EC2..."

                        & ssh `
                            -i "$env:EC2_KEY" `
                            -o StrictHostKeyChecking=accept-new `
                            -o ConnectTimeout=15 `
                            "$($env:EC2_USER)@$($env:EC2_HOST)" `
                            $remoteCommand

                        if ($LASTEXITCODE -ne 0) {
                            throw "Deployment to AWS EC2 failed."
                        }

                        Write-Host "StaySmart container deployment completed."

                        # Remove the transferred archive after successful deployment.
                        & ssh `
                            -i "$env:EC2_KEY" `
                            -o StrictHostKeyChecking=accept-new `
                            "$($env:EC2_USER)@$($env:EC2_HOST)" `
                            'rm -f /tmp/staysmart.tar'

                        if ($LASTEXITCODE -ne 0) {
                            Write-Warning "Deployment succeeded, but the temporary image archive could not be removed."
                        }
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'StaySmart CI/CD: checks passed, Docker image built and transferred, and EC2 deployment completed.'
        }

        failure {
            echo 'StaySmart CI/CD failed. Inspect the first failed stage in the console log.'
        }

        always {
            echo 'StaySmart CI/CD pipeline execution completed.'
        }
    }
}
