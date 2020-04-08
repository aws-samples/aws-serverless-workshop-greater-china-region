import yaml
import sys
from yattag import Doc

def lambda_handler(event, context):

    configuration = yaml.load(open("config.yaml").read())
    questions = configuration['Questions'];
    title = configuration['Title'];
    author = configuration['Author'];
    image = configuration['Image'];
    theme = configuration['Theme'];
    
    questionsNames = list()
    for questionIterator in questions:
        questionsNames.append(questionIterator)
    questionsNames.sort()
    
    doc, tag, text = Doc().tagtext()

    with tag('html'):
        with tag('body'):
                            
            doc.stag('br')
            doc.stag('br')
            doc.stag('br')
            
            with tag('div', align='center'):
                doc.stag('font', size="6", style="font-weight: bold; font-family: verdana; color:#" + str(theme) + ";")  
                text(title)
                doc.stag('br')
                doc.stag('font', size="2", style="font-weight: bold; font-family: verdana")  
                text("by " + author)
                doc.stag('br')
                doc.stag('img', src=image, width="500")
                doc.stag('br')
                doc.stag('br')
            
            with tag('form', action = "submitsurvey"):
                with tag('div', style="margin-left: auto; margin-right: auto; width: 40%;"):
                    for questionName in questionsNames:
                        questionLabel = questions[questionName]['Label']
                        questionType = questions[questionName]['Type']
            
                        doc.stag('font', size="4", style="font-weight: bold; font-family: verdana; color:#" + str(theme) + ";")    
                        text(questionLabel)
                        doc.stag('br')
                        
                        if (questionType == "Text"):
                            with doc.textarea(name = questionName, style="width: 100%; border-color: #" + str(theme) + "; " , rows="5"):
                                pass
                            
                        if (questionType == "ShortText"):  
                            with doc.textarea(name = questionName, style="width: 100%; border-color: #" + str(theme) + "; " , rows="1"):
                                pass
                            
                        if (questionType == "Radio"):
                            values = questions[questionName]['Values']
                            for valueIterator in values:
                                value = questions[questionName]['Values'][valueIterator]
                                doc.input(name = questionName, type = 'radio', value = value, style="border-color: #" + str(theme) + "; ")
                                doc.stag('font', size="2", style="font-weight: normal; font-family: verdana; color:black")
                                text(str(value))
                                doc.stag('br')
                            
                        doc.stag('br')
                        doc.stag('br')
    
                    doc.stag('input', type = "submit", value = "Send!", style="background-color: #" + str(theme) + "; border: none; color: white; float: right; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer;")




    htmlResult = doc.getvalue()

    return {
            'statusCode': "200",
            'body': htmlResult,
            'headers': {
                'Content-Type': 'text/html',
            }
        }
