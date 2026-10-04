pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME = 'staysmart-static'
        CONTAINER_NAME = 'staysmart-static-demo'
        APP_PORT = '8081'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate project') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    $requiredFiles = @(
                        'index.html', 'vendor.html', 'admin.html',
                        'css/style.css', 'js/data.js', 'js/panel.js',
                        'js/app.js', 'js/vendor.js', 'js/admin.js',
                        'images/properties/bedroom.jpg', 'Dockerfile'
                    )

                    foreach ($file in $requiredFiles) {
                        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
                            throw "Required project file is missing: $file"
                        }
                    }

                    $node = Get-Command node -ErrorAction SilentlyContinue
                    if ($node) {
                        Get-ChildItem -LiteralPath 'js' -Filter '*.js' | ForEach-Object {
                            & $node.Source --check $_.FullName
                            if ($LASTEXITCODE -ne 0) {
                                throw "JavaScript syntax validation failed: $($_.Name)"
                            }
                        }
                        Write-Output 'All JavaScript files passed node --check.'
                    }
                    else {
                        Write-Output 'Node.js is not installed on this Jenkins agent; JavaScript syntax checks were skipped.'
                    }

                    Write-Output 'Required static site files are present.'
                '''
            }
        }

        stage('Build Docker image') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    docker build --pull --tag "$env:IMAGE_NAME`:$env:BUILD_NUMBER" .
                    if ($LASTEXITCODE -ne 0) {
                        throw 'Docker image build failed.'
                    }
                '''
            }
        }

        stage('Deploy locally') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    $existing = docker ps --all --filter "name=^/$env:CONTAINER_NAME$" --format "{{.Names}}"
                    if ($LASTEXITCODE -ne 0) {
                        throw 'Could not query Docker containers.'
                    }

                    if ($existing -contains $env:CONTAINER_NAME) {
                        docker rm --force $env:CONTAINER_NAME
                        if ($LASTEXITCODE -ne 0) {
                            throw "Could not replace container $env:CONTAINER_NAME."
                        }
                    }

                    docker run --detach --name $env:CONTAINER_NAME --publish "$env:APP_PORT`:80" --restart unless-stopped "$env:IMAGE_NAME`:$env:BUILD_NUMBER"
                    if ($LASTEXITCODE -ne 0) {
                        throw 'Docker container deployment failed.'
                    }

                    $ready = $false
                    for ($attempt = 0; $attempt -lt 15; $attempt++) {
                        try {
                            $response = Invoke-WebRequest -Uri "http://localhost:$env:APP_PORT/" -UseBasicParsing -TimeoutSec 2
                            if ($response.StatusCode -eq 200 -and $response.Content.Contains('StaySmart')) {
                                $ready = $true
                                break
                            }
                        }
                        catch {
                            Start-Sleep -Seconds 1
                        }
                    }

                    if (-not $ready) {
                        docker logs $env:CONTAINER_NAME
                        throw "The site did not become ready at http://localhost:$env:APP_PORT/."
                    }

                    Write-Output "Deployment verified: http://localhost:$env:APP_PORT/"
                '''
            }
        }
    }
}
